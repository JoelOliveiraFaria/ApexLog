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
    }
}
