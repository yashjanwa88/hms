using AppointmentService.Domain;
using AppointmentService.DTOs;
using AppointmentService.Repositories;

namespace AppointmentService.Application;

public interface IQueueService
{
    Task<QueueTokenResponse> AssignTokenAsync(Guid tenantId, CreateQueueTokenRequest request, Guid? createdBy);
    Task<CallNextPatientResponse?> CallNextPatientAsync(Guid tenantId, Guid doctorId);
    Task<QueueTokenResponse?> CallSpecificTokenAsync(Guid tokenId, Guid tenantId);
    Task<bool> UpdateTokenStatusAsync(Guid tokenId, string status, Guid tenantId);
    Task<bool> CompleteTokenAsync(Guid tokenId, Guid tenantId);
    Task<QueueDisplayResponse> GetQueueDisplayAsync(Guid tenantId, Guid? doctorId = null);
    Task<List<QueueTokenResponse>> GetActiveQueueAsync(Guid tenantId, Guid? doctorId = null);
    Task<List<QueueTokenResponse>> GetTodayTokensAsync(Guid tenantId, Guid? doctorId = null);
    Task<QueueStatisticsResponse?> GetDailyStatisticsAsync(Guid tenantId, DateTime date, Guid? doctorId = null);
}

public class QueueService : IQueueService
{
    private readonly IQueueRepository _queueRepository;

    public QueueService(IQueueRepository queueRepository)
    {
        _queueRepository = queueRepository;
    }

    public async Task<QueueTokenResponse> AssignTokenAsync(Guid tenantId, CreateQueueTokenRequest request, Guid? createdBy)
    {
        // Determine token prefix based on priority
        var prefix = request.Priority switch
        {
            2 => "E",  // Emergency
            1 => "S",  // Senior
            _ => "T"   // Normal
        };

        // Generate token number
        var tokenNumber = await _queueRepository.GenerateTokenNumberAsync(tenantId, prefix);
        
        // Extract sequence number from token
        var sequenceNumber = int.Parse(tokenNumber.Substring(1));

        // Create token entity
        var token = new QueueToken
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TokenNumber = tokenNumber,
            TokenPrefix = prefix,
            SequenceNumber = sequenceNumber,
            PatientId = request.PatientId,
            PatientName = request.PatientName,
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            DoctorName = request.DoctorName,
            QueueDate = DateTime.UtcNow.Date,
            Status = "Waiting",
            AssignedAt = DateTime.UtcNow,
            Priority = request.Priority,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        var createdToken = await _queueRepository.CreateTokenAsync(token);
        
        // Get queue position
        var position = await _queueRepository.GetQueuePositionAsync(createdToken.Id);

        return new QueueTokenResponse
        {
            Id = createdToken.Id,
            TokenNumber = createdToken.TokenNumber,
            PatientName = createdToken.PatientName,
            DoctorName = createdToken.DoctorName,
            Status = createdToken.Status,
            Priority = createdToken.Priority,
            AssignedAt = createdToken.AssignedAt,
            QueuePosition = position
        };
    }

    public async Task<CallNextPatientResponse?> CallNextPatientAsync(Guid tenantId, Guid doctorId)
    {
        // Get next waiting token for this doctor
        var nextToken = await _queueRepository.GetNextWaitingTokenAsync(tenantId, doctorId);
        
        if (nextToken == null)
        {
            return null;
        }

        // Update status to Called
        var success = await _queueRepository.CallTokenAsync(nextToken.Id, tenantId);
        
        if (!success)
        {
            return null;
        }

        return new CallNextPatientResponse
        {
            TokenId = nextToken.Id,
            TokenNumber = nextToken.TokenNumber,
            PatientName = nextToken.PatientName,
            Message = $"Calling {nextToken.TokenNumber} - {nextToken.PatientName}"
        };
    }

    public async Task<QueueTokenResponse?> CallSpecificTokenAsync(Guid tokenId, Guid tenantId)
    {
        var token = await _queueRepository.GetTokenByIdAsync(tokenId, tenantId);
        
        if (token == null || token.Status != "Waiting")
        {
            return null;
        }

        var success = await _queueRepository.CallTokenAsync(tokenId, tenantId);
        
        if (!success)
        {
            return null;
        }

        var updatedToken = await _queueRepository.GetTokenByIdAsync(tokenId, tenantId);
        
        return MapToResponse(updatedToken!);
    }

    public async Task<bool> UpdateTokenStatusAsync(Guid tokenId, string status, Guid tenantId)
    {
        return await _queueRepository.UpdateTokenStatusAsync(tokenId, status, tenantId);
    }

    public async Task<bool> CompleteTokenAsync(Guid tokenId, Guid tenantId)
    {
        return await _queueRepository.CompleteTokenAsync(tokenId, tenantId);
    }

    public async Task<QueueDisplayResponse> GetQueueDisplayAsync(Guid tenantId, Guid? doctorId = null)
    {
        var activeQueue = await _queueRepository.GetActiveQueueAsync(tenantId, doctorId);
        
        var waitingQueue = activeQueue.Where(q => q.Status == "Waiting").ToList();
        var currentToken = activeQueue.FirstOrDefault(q => q.Status == "InProgress");
        var calledToken = activeQueue.FirstOrDefault(q => q.Status == "Called");
        
        var nextToken = currentToken == null && calledToken == null 
            ? waitingQueue.FirstOrDefault() 
            : waitingQueue.Skip(1).FirstOrDefault();

        var avgWaitTime = waitingQueue.Any() 
            ? waitingQueue.Average(q => q.WaitTimeMinutes) 
            : 0;

        return new QueueDisplayResponse
        {
            DoctorName = activeQueue.FirstOrDefault()?.DoctorName ?? "All Doctors",
            WaitingQueue = waitingQueue.Take(10).Select(MapToDisplayItem).ToList(),
            CurrentToken = currentToken != null ? MapToDisplayItem(currentToken) : calledToken != null ? MapToDisplayItem(calledToken) : null,
            NextToken = nextToken != null ? MapToDisplayItem(nextToken) : null,
            TotalWaiting = waitingQueue.Count,
            AverageWaitTimeMinutes = avgWaitTime
        };
    }

    public async Task<List<QueueTokenResponse>> GetActiveQueueAsync(Guid tenantId, Guid? doctorId = null)
    {
        var activeQueue = await _queueRepository.GetActiveQueueAsync(tenantId, doctorId);
        
        return activeQueue.Select(q => new QueueTokenResponse
        {
            Id = q.Id,
            TokenNumber = q.TokenNumber,
            PatientName = q.PatientName,
            DoctorName = q.DoctorName,
            Status = q.Status,
            Priority = q.Priority,
            AssignedAt = q.AssignedAt,
            CalledAt = q.CalledAt,
            WaitTimeMinutes = q.WaitTimeMinutes,
            QueuePosition = q.QueuePosition
        }).ToList();
    }

    public async Task<List<QueueTokenResponse>> GetTodayTokensAsync(Guid tenantId, Guid? doctorId = null)
    {
        var tokens = await _queueRepository.GetTodayTokensAsync(tenantId, doctorId);
        return tokens.Select(MapToResponse).ToList();
    }

    public async Task<QueueStatisticsResponse?> GetDailyStatisticsAsync(Guid tenantId, DateTime date, Guid? doctorId = null)
    {
        var stats = await _queueRepository.GetDailyStatisticsAsync(tenantId, date, doctorId);
        
        if (stats == null || stats.TotalTokens == 0)
        {
            return null;
        }

        var completionRate = stats.TotalTokens > 0 
            ? (double)stats.CompletedTokens / stats.TotalTokens * 100 
            : 0;

        return new QueueStatisticsResponse
        {
            QueueDate = stats.QueueDate,
            TotalTokens = stats.TotalTokens,
            CompletedTokens = stats.CompletedTokens,
            CancelledTokens = stats.CancelledTokens,
            WaitingTokens = stats.WaitingTokens,
            AvgWaitTimeMinutes = stats.AvgWaitTimeMinutes,
            MaxWaitTimeMinutes = stats.MaxWaitTimeMinutes,
            AvgServiceTimeMinutes = stats.AvgServiceTimeMinutes,
            CompletionRate = Math.Round(completionRate, 2)
        };
    }

    // Helper methods
    private QueueTokenResponse MapToResponse(QueueToken token)
    {
        return new QueueTokenResponse
        {
            Id = token.Id,
            TokenNumber = token.TokenNumber,
            PatientName = token.PatientName,
            DoctorName = token.DoctorName,
            Status = token.Status,
            Priority = token.Priority,
            AssignedAt = token.AssignedAt,
            CalledAt = token.CalledAt,
            CompletedAt = token.CompletedAt
        };
    }

    private QueueDisplayItem MapToDisplayItem(ActiveQueueItem item)
    {
        return new QueueDisplayItem
        {
            TokenNumber = item.TokenNumber,
            PatientName = item.PatientName,
            Status = item.Status,
            Priority = item.Priority,
            WaitTimeMinutes = item.WaitTimeMinutes
        };
    }
}
