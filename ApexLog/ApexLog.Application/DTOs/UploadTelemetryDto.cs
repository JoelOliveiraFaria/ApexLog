using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Application.DTOs
{
    public record UploadTelemetryDto
    (
        string MotoId,
        DateTime StartTime,
        DateTime EndTime,
        double DistanceKm,
        List<TelemetryPointDto> TelemetryPoints
    );

    public record TelemetryPointDto 
    (
        DateTime Timestamp,
        int Rpm,
        int SpeedKmh,
        double ThrottlePosition,
        double EngineTempC
    );
}
