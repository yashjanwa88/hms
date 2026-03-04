using AnalyticsService.DTOs;
using AnalyticsService.Repositories;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace AnalyticsService.EventConsumers;

public class AnalyticsEventConsumer : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AnalyticsEventConsumer> _logger;
    private readonly string _rabbitMQHost;
    private readonly int _rabbitMQPort;
    private readonly string _rabbitMQUser;
    private readonly string _rabbitMQPass;
    private IConnection? _connection;
    private IModel? _channel;

    public AnalyticsEventConsumer(
        IServiceProvider serviceProvider,
        ILogger<AnalyticsEventConsumer> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _rabbitMQHost = configuration["RabbitMQ:Host"] ?? "localhost";
        _rabbitMQPort = int.Parse(configuration["RabbitMQ:Port"] ?? "5672");
        _rabbitMQUser = configuration["RabbitMQ:Username"] ?? "guest";
        _rabbitMQPass = configuration["RabbitMQ:Password"] ?? "guest";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(5000, stoppingToken); // Wait for RabbitMQ to be ready

        var factory = new ConnectionFactory
        {
            HostName = _rabbitMQHost,
            Port = _rabbitMQPort,
            UserName = _rabbitMQUser,
            Password = _rabbitMQPass
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        ConsumeEvent("EncounterCompletedEvent", ProcessEncounterCompletedAsync);
        ConsumeEvent("InvoiceGeneratedEvent", ProcessInvoiceGeneratedAsync);
        ConsumeEvent("PaymentCompletedEvent", ProcessPaymentCompletedAsync);
        ConsumeEvent("ClaimSubmittedEvent", ProcessClaimSubmittedAsync);
        ConsumeEvent("ClaimSettledEvent", ProcessClaimSettledAsync);

        _logger.LogInformation("Analytics Event Consumer started");

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private void ConsumeEvent(string eventType, Func<string, Task> handler)
    {
        _channel!.QueueDeclare(queue: eventType, durable: true, exclusive: false, autoDelete: false);

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);

            try
            {
                await handler(message);
                _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing {eventType}: {message}");
                _channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(queue: eventType, autoAck: false, consumer: consumer);
    }

    private async Task ProcessEncounterCompletedAsync(string message)
    {
        var evt = JsonSerializer.Deserialize<EncounterCompletedEvent>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (evt == null) return;

        using var scope = _serviceProvider.CreateScope();
        var offsetRepo = scope.ServiceProvider.GetRequiredService<IEventOffsetRepository>();
        var doctorRepo = scope.ServiceProvider.GetRequiredService<IDoctorPerformanceRepository>();
        var patientRepo = scope.ServiceProvider.GetRequiredService<IPatientSummaryRepository>();

        if (await offsetRepo.IsEventProcessedAsync("EncounterCompleted", evt.EventId.ToString(), evt.TenantId))
            return;

        await doctorRepo.UpsertPerformanceAsync(evt.DoctorId, "Doctor", evt.CompletedAt.Date, 1, 1, 0, evt.TenantId, evt.DoctorId);
        await patientRepo.UpsertPatientMetricsAsync(evt.CompletedAt.Date, 0, 1, 0, 0, evt.TenantId, evt.DoctorId);
        await offsetRepo.RecordEventAsync("EncounterCompleted", evt.EventId.ToString(), evt.TenantId, evt.DoctorId);

        _logger.LogInformation($"Processed EncounterCompleted: {evt.EncounterId}");
    }

    private async Task ProcessInvoiceGeneratedAsync(string message)
    {
        var evt = JsonSerializer.Deserialize<InvoiceGeneratedEvent>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (evt == null) return;

        using var scope = _serviceProvider.CreateScope();
        var offsetRepo = scope.ServiceProvider.GetRequiredService<IEventOffsetRepository>();
        var revenueRepo = scope.ServiceProvider.GetRequiredService<IRevenueSummaryRepository>();

        if (await offsetRepo.IsEventProcessedAsync("InvoiceGenerated", evt.EventId.ToString(), evt.TenantId))
            return;

        await revenueRepo.UpsertDailyRevenueAsync(evt.InvoiceDate.Date, 0, 0, 1, 0, evt.TenantId, evt.PatientId);
        await offsetRepo.RecordEventAsync("InvoiceGenerated", evt.EventId.ToString(), evt.TenantId, evt.PatientId);

        _logger.LogInformation($"Processed InvoiceGenerated: {evt.InvoiceId}");
    }

    private async Task ProcessPaymentCompletedAsync(string message)
    {
        var evt = JsonSerializer.Deserialize<PaymentCompletedEvent>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (evt == null) return;

        using var scope = _serviceProvider.CreateScope();
        var offsetRepo = scope.ServiceProvider.GetRequiredService<IEventOffsetRepository>();
        var revenueRepo = scope.ServiceProvider.GetRequiredService<IRevenueSummaryRepository>();

        if (await offsetRepo.IsEventProcessedAsync("PaymentCompleted", evt.EventId.ToString(), evt.TenantId))
            return;

        await revenueRepo.UpsertDailyRevenueAsync(evt.OccurredAt.Date, evt.Amount, 0, 0, 1, evt.TenantId, evt.PatientId);
        await offsetRepo.RecordEventAsync("PaymentCompleted", evt.EventId.ToString(), evt.TenantId, evt.PatientId);

        _logger.LogInformation($"Processed PaymentCompleted: {evt.PaymentId}");
    }

    private async Task ProcessClaimSubmittedAsync(string message)
    {
        var evt = JsonSerializer.Deserialize<ClaimSubmittedEvent>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (evt == null) return;

        using var scope = _serviceProvider.CreateScope();
        var offsetRepo = scope.ServiceProvider.GetRequiredService<IEventOffsetRepository>();
        var insuranceRepo = scope.ServiceProvider.GetRequiredService<IInsuranceSummaryRepository>();

        if (await offsetRepo.IsEventProcessedAsync("ClaimSubmitted", evt.EventId.ToString(), evt.TenantId))
            return;

        await insuranceRepo.UpsertClaimAsync(evt.PolicyId, "Provider", evt.OccurredAt.Date, evt.ClaimAmount, "Submitted", null, null, evt.TenantId, evt.PatientId);
        await offsetRepo.RecordEventAsync("ClaimSubmitted", evt.EventId.ToString(), evt.TenantId, evt.PatientId);

        _logger.LogInformation($"Processed ClaimSubmitted: {evt.ClaimId}");
    }

    private async Task ProcessClaimSettledAsync(string message)
    {
        var evt = JsonSerializer.Deserialize<ClaimSettledEvent>(message, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (evt == null) return;

        using var scope = _serviceProvider.CreateScope();
        var offsetRepo = scope.ServiceProvider.GetRequiredService<IEventOffsetRepository>();
        var insuranceRepo = scope.ServiceProvider.GetRequiredService<IInsuranceSummaryRepository>();

        if (await offsetRepo.IsEventProcessedAsync("ClaimSettled", evt.EventId.ToString(), evt.TenantId))
            return;

        await insuranceRepo.UpsertClaimAsync(Guid.Empty, "Provider", evt.OccurredAt.Date, 0, "Settled", evt.SettledAmount, evt.SettledAmount, evt.TenantId, evt.PatientId);
        await offsetRepo.RecordEventAsync("ClaimSettled", evt.EventId.ToString(), evt.TenantId, evt.PatientId);

        _logger.LogInformation($"Processed ClaimSettled: {evt.ClaimId}");
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
