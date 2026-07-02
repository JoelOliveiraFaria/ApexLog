using System;
using System.Collections.Generic;

namespace ApexLog.Application.DTOs;

public class UploadTripDto
{
    public string MotoId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public double DistanceKm { get; set; }
    public List<TelemetryPointDto> TelemetryPoints { get; set; } = new();
}
