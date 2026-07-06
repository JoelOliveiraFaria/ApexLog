using System;

namespace ApexLog.Application.DTOs;

public record MotorcycleDto(Guid Id, string Make, string Model, int Year, string Nickname);

public record CreateMotorcycleDto(string Make, string Model, int Year, string Nickname);

public record UpdateMotorcycleDto(string Make, string Model, int Year, string Nickname);
