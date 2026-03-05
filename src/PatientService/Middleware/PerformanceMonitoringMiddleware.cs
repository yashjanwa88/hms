using System.Diagnostics;

namespace PatientService.Middleware;

public class PerformanceMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;

    public PerformanceMonitoringMiddleware(RequestDelegate next, ILogger<PerformanceMonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.TraceIdentifier;
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            
            var responseTime = stopwatch.ElapsedMilliseconds;
            var statusCode = context.Response.StatusCode;
            var method = context.Request.Method;
            var path = context.Request.Path;
            
            // Log slow requests
            if (responseTime > 1000)
            {
                _logger.LogWarning("Slow request detected: {Method} {Path} took {ResponseTime}ms (Request: {RequestId})", 
                    method, path, responseTime, requestId);
            }
            else if (responseTime > 500)
            {
                _logger.LogInformation("Request {Method} {Path} took {ResponseTime}ms (Request: {RequestId})", 
                    method, path, responseTime, requestId);
            }
            
            // Add performance headers only if response hasn't started
            if (!context.Response.HasStarted)
            {
                context.Response.Headers["X-Response-Time"] = $"{responseTime}ms";
                context.Response.Headers["X-Request-Id"] = requestId;
            }
        }
    }
}