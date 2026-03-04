using Shared.EventBus.Interfaces;

namespace Shared.EventBus;

public class NoOpEventBus : IEventBus
{
    public void Publish<T>(T @event) where T : IEvent { }
    public void Subscribe<T>(Action<T> handler) where T : IEvent { }
    public void Dispose() { }
}
