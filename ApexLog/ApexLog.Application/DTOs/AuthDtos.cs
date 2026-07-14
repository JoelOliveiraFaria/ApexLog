using System;

namespace ApexLog.Application.DTOs;

public record RegisterDto(string Name, string Email, string Password);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(Guid UserId, string Name, string Email, string Token);

public record UserProfileDto(Guid Id, string Name, string Email);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);