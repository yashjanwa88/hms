using Shared.Common.Models;

namespace AppointmentService.Domain;

/// <summary>
/// Queue token for patient queue management
/// </summary>
public class QueueToken : BaseEntity
{
    // Token Information
    public string TokenNumber { get; set; } = string.Empty;
    public string TokenPrefix { get; set; } = "T";
    public int SequenceNumber { get; set; }
    
    // Patient & Appointment
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    
    // Queue Status
    public DateTime QueueDate { get; set; }
    public string Status { get; set; } = "Waiting";  // Waiting, Called, InProgress, Completed, Cancelled
    
    // Timestamps
    public DateTime AssignedAt { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // Additional Info
    public int Priority { get; set; } = 0;  // 0=Normal, 1=Senior, 2=Emergency
    public string? Notes { get; set; }
}

/// <summary>
/// Queue sequence for token number generation
/// </summary>
public class QueueSequence : BaseEntity
{
    public DateTime QueueDate { get; set; }
    public string Prefix { get; set; } = "T";
    public int LastSequence { get; set; } = 0;
}

/// <summary>
/// Queue statistics for analytics
/// </summary>
public class QueueStatistics
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime QueueDate { get; set; }
    public Guid? DoctorId { get; set; }
    
    // Counts
    public int TotalTokens { get; set; }
    public int CompletedTokens { get; set; }
    public int CancelledTokens { get; set; }
    public int WaitingTokens { get; set; }
    
    // Timing
    public int? AvgWaitTimeMinutes { get; set; }
    public int? MinWaitTimeMinutes { get; set; }
    public int? MaxWaitTimeMinutes { get; set; }
    public int? AvgServiceTimeMinutes { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Active queue view model
/// </summary>
public class ActiveQueueItem
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TokenNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? CalledAt { get; set; }
    public double WaitTimeMinutes { get; set; }
    public int QueuePosition { get; set; }
}
