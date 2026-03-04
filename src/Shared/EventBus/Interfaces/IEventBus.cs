namespace Shared.EventBus.Interfaces;

public interface IEventBus
{
    void Publish<T>(T @event) where T : IEvent;
    void Subscribe<T>(Action<T> handler) where T : IEvent;
}
