using ApexLog.Application.DTOs;
using ApexLog.Application.Services;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Reflection.Metadata.Ecma335;

namespace ApexLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TripsController : ControllerBase
    {
        private readonly UploadTelemetryService _uploadService;
        private readonly TripQueryService _queryService;

        public TripsController(UploadTelemetryService uploadService, TripQueryService queryService)
        {
            _uploadService = uploadService;
            _queryService = queryService;
        }

        // 1. Criar Viagem (POST /api/trips)
        [HttpPost]
        public async Task<IActionResult> UploadTrip([FromBody] UploadTripDto request)
        {
            try
            {
                await _uploadService.UploadAsync(request);

                return Ok(new { message = "Viagem e pontos de telemetria gravados com sucesso no Postgres!" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Erro interno no servidor", details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<TripSummaryDto>>> GetTrips()
        {
            var trips = await _queryService.GetAllTripsAsync();

            return Ok(trips);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<TripDetailDto>> GetTripById(Guid id)
        {
            var trip = await _queryService.GetTripByIdAsync(id);

            if (trip == null)
            {
                return NotFound(new {message = "Viagem nao encontrada"});
            }

            return Ok(trip);
        }

        // 3. Iniciar Viagem em streaming (POST /api/trips/start)
        [HttpPost("start")]
        public async Task<ActionResult<StartTripResponseDto>> StartTrip([FromBody] StartTripDto request)
        {
            try
            {
                var tripId = await _uploadService.StartTripAsync(request.MotorcycleId, request.StartTime);
                return Ok(new StartTripResponseDto(tripId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // 4. Inserção em lote de telemetria numa viagem em curso (POST /api/trips/{id}/telemetry)
        [HttpPost("{id:guid}/telemetry")]
        public async Task<IActionResult> UploadTelemetryBatch(Guid id, [FromBody] TelemetryBatchDto request)
        {
            if (request.Points == null || request.Points.Count == 0)
            {
                return BadRequest(new { error = "O lote não contém pontos de telemetria." });
            }

            try
            {
                await _uploadService.AppendTelemetryBatchAsync(id, request.Points);
                return Ok(new { message = $"{request.Points.Count} pontos gravados com sucesso.", tripId = id });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        // 5. Finalizar viagem e calcular métricas agregadas (POST /api/trips/{id}/finish)
        [HttpPost("{id:guid}/finish")]
        public async Task<IActionResult> FinishTrip(Guid id, [FromBody] FinishTripDto request)
        {
            try
            {
                await _uploadService.FinishTripAsync(id, request.EndTime, request.DistanceKm);
                return Ok(new { message = "Viagem finalizada e métricas agregadas calculadas." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
