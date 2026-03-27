namespace AppointmentService.DTOs;

// =====================================================
// QUEUE TOKEN DTOs
// =====================================================

public class QueueTokenResponse
{
    public Guid Id { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public double? WaitTimeMinutes { get; set; }
    public int? QueuePosition { get; set; }
}

public class CreateQueueTokenRequest
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;  // 0=Normal, 1=Senior, 2=Emergency
    public string? Notes { get; set; }
}

public class UpdateQueueStatusRequest
{
    public string Status { get; set; } = string.Empty;  // Called, InProgress, Completed, Cancelled
    public string? Notes { get; set; }
}

// =====================================================
// QUEUE DISPLAY DTOs
// =====================================================

public class QueueDisplayResponse
{
    public string DoctorName { get; set; } = string.Empty;
    public List<QueueDisplayItem> WaitingQueue { get; set; } = new();
    public QueueDisplayItem? CurrentToken { get; set; }
    public QueueDisplayItem? NextToken { get; set; }
    public int TotalWaiting { get; set; }
    public double AverageWaitTimeMinutes { get; set; }
}

public class QueueDisplayItem
{
    public string TokenNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public double WaitTimeMinutes { get; set; }
}

// =====================================================
// QUEUE STATISTICS DTOs
// =====================================================

public class QueueStatisticsResponse
{
    public DateTime QueueDate { get; set; }
    public string? DoctorName { get; set; }
    public int TotalTokens { get; set; }
    public int CompletedTokens { get; set; }
    public int CancelledTokens { get; set; }
    public int WaitingTokens { get; set; }
    public int? AvgWaitTimeMinutes { get; set; }
    public int? MaxWaitTimeMinutes { get; set; }
    public int? AvgServiceTimeMinutes { get; set; }
    public double CompletionRate { get; set; }
}

// =====================================================
// QUEUE MANAGEMENT DTOs
// =====================================================

public class CallNextPatientResponse
{
    public Guid TokenId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
