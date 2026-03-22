using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Authorization;
using Shared.Common.Models;

namespace DoctorService.Controllers;

[ApiController]
[Route("api/doctor/v1/upload")]
[Authorize]
public class FileUploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileUploadController> _logger;

    public FileUploadController(IWebHostEnvironment environment, ILogger<FileUploadController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("profile-picture")]
    [RequirePermission("doctor.update")]
    public async Task<ActionResult<ApiResponse<string>>> UploadProfilePicture(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<string>.ErrorResponse("No file uploaded"));

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
                return BadRequest(ApiResponse<string>.ErrorResponse("Invalid file type"));

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                return BadRequest(ApiResponse<string>.ErrorResponse("File too large"));

            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "doctors");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = $"/uploads/doctors/{fileName}";
            return Ok(ApiResponse<string>.SuccessResponse(relativePath, "File uploaded successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading profile picture");
            return StatusCode(500, ApiResponse<string>.ErrorResponse("Upload failed"));
        }
    }
}