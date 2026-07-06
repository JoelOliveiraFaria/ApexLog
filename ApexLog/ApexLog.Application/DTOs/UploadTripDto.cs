using System;
using System.Collections.Generic;

namespace ApexLog.Application.DTOs;

public class UploadTripDto
{
    public Guid MotorcycleId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public double DistanceKm { get; set; }
    public List<TelemetryPointDto> TelemetryPoints { get; set; } = new();
}
