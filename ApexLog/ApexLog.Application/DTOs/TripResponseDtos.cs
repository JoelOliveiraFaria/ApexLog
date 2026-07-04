using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Application.DTOs
{
    public class TripSummaryDto
    {
        public Guid Id { get; set; }
        public string MotoId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double DistanceKm { get; set; }
        public int MaxSpeedKmh { get; set; }
        public double AvgSpeedKmh { get; set; }
        public int MaxRpm { get; set; }
    }

    public class TripDetailDto
    {
        public Guid Id { get; set; }
        public string MotoId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double DistanceKm { get; set; }
        public int MaxSpeedKmh { get; set; }
        public double AvgSpeedKmh { get; set; }
        public int MaxRpm { get; set; }
        public List<TelemetryPointResponseDto> TelemetryPoints { get; set; } = new();
    }

    public class TelemetryPointResponseDto
    {
        public DateTime Timestamp { get; set; }
        public int Rpm { get; set; }
        public int SpeedKmh { get; set; }
        public double ThrottlePosition { get; set; }
        public double EngineTempC { get; set; }
    }
}
