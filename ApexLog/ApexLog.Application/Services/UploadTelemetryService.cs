using ApexLog.Application.DTOs;
using ApexLog.Application.Interfaces;
using ApexLog.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApexLog.Application.Services
{
    public class UploadTelemetryService
    {
        private readonly ITripRepository _tripRepository;

        public UploadTelemetryService(ITripRepository tripRepository)
        {
            _tripRepository = tripRepository;
        }

        public async Task ExecuteAsync(UploadTelemetryDto dto)
        {
            // 1. Criar a entidade de Domínio principal (roda as regras do construtor)
            var trip = new Trip(dto.MotoId, dto.StartTime);

            // 2. Mapear e adicionar cada ponto de telemetria à viagem
            foreach (var p in dto.TelemetryPoints)
            {
                var point = new TelemetryPoint(p.Timestamp, p.Rpm, p.SpeedKmh, p.ThrottlePosition, p.EngineTempC);
                trip.AddTelemetryPoints(point);
            }

            // 3. Finalizar a viagem com os dados macro (roda as validações de tempo/distância)
            trip.EndTrip(dto.EndTime, dto.DistanceKm);

            // 4. Mandar persistir na base de dados através do contrato
            await _tripRepository.SaveAsync(trip);
        }
    }
}
