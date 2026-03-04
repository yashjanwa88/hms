using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Shared.EventBus.Interfaces;
using System.Text;

namespace Shared.EventBus;

public class RabbitMQEventBus : IEventBus, IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;

    public RabbitMQEventBus(string hostname)
    {
        var factory = new ConnectionFactory { HostName = hostname };
        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
    }

    public void Publish<T>(T @event) where T : IEvent
    {
        var eventName = typeof(T).Name;
        _channel.QueueDeclare(queue: eventName, durable: true, exclusive: false, autoDelete: false, arguments: null);

        var message = JsonConvert.SerializeObject(@event);
        var body = Encoding.UTF8.GetBytes(message);

        _channel.BasicPublish(exchange: "", routingKey: eventName, basicProperties: null, body: body);
    }

    public void Subscribe<T>(Action<T> handler) where T : IEvent
    {
        var eventName = typeof(T).Name;
        _channel.QueueDeclare(queue: eventName, durable: true, exclusive: false, autoDelete: false, arguments: null);

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            var @event = JsonConvert.DeserializeObject<T>(message);
            
            if (@event != null)
            {
                handler(@event);
            }
        };

        _channel.BasicConsume(queue: eventName, autoAck: true, consumer: consumer);
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}
