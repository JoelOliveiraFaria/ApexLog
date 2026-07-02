using ApexLog.Application.DTOs;
using ApexLog.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApexLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TripsController : ControllerBase
    {
        private readonly UploadTelemetryService _uploadService;

        public TripsController(UploadTelemetryService uploadService)
        {
            _uploadService = uploadService;
        }

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
    }
}
