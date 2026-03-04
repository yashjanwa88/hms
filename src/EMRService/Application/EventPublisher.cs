using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace EMRService.Application;

public record LabOrderRequestedEvent(Guid EncounterId, Guid PatientId, Guid TenantId, DateTime RequestedAt);
public record PrescriptionRequestedEvent(Guid EncounterId, Guid PatientId, Guid TenantId, DateTime RequestedAt);
public record EncounterClosedEvent(Guid EncounterId, Guid PatientId, Guid DoctorId, Guid TenantId, DateTime ClosedAt);

public interface IEventPublisher
{
    Task PublishAsync<T>(string eventName, T eventData);
}

public class RabbitMQEventPublisher : IEventPublisher
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<RabbitMQEventPublisher> _logger;

    public RabbitMQEventPublisher(IConfiguration configuration, ILogger<RabbitMQEventPublisher> logger)
    {
        _logger = logger;
        var factory = new ConnectionFactory
        {
            HostName = configuration["RabbitMQ:Host"] ?? "localhost",
            Port = int.Parse(configuration["RabbitMQ:Port"] ?? "5672"),
            UserName = configuration["RabbitMQ:Username"] ?? "admin",
            Password = configuration["RabbitMQ:Password"] ?? "admin"
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare("emr_events", ExchangeType.Topic, durable: true);
    }

    public Task PublishAsync<T>(string eventName, T eventData)
    {
        var message = JsonSerializer.Serialize(eventData);
        var body = Encoding.UTF8.GetBytes(message);

        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;
        properties.ContentType = "application/json";

        _channel.BasicPublish(
            exchange: "emr_events",
            routingKey: eventName,
            basicProperties: properties,
            body: body
        );

        _logger.LogInformation("Published event {EventName}: {Message}", eventName, message);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}
