using ApexLog.Application.DTOs;
using ApexLog.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApexLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MotorcyclesController : ControllerBase
    {
        private readonly MotorcycleService _motorcycleService;

        public MotorcyclesController(MotorcycleService motorcycleService)
        {
            _motorcycleService = motorcycleService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<MotorcycleDto>>> GetAll()
        {
            return Ok(await _motorcycleService.GetAllAsync());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<MotorcycleDto>> GetById(Guid id)
        {
            var motorcycle = await _motorcycleService.GetByIdAsync(id);
            return motorcycle == null
                ? NotFound(new { message = "Mota não encontrada." })
                : Ok(motorcycle);
        }

        [HttpPost]
        public async Task<ActionResult<MotorcycleDto>> Create([FromBody] CreateMotorcycleDto request)
        {
            try
            {
                var motorcycle = await _motorcycleService.CreateAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = motorcycle.Id }, motorcycle);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<MotorcycleDto>> Update(Guid id, [FromBody] UpdateMotorcycleDto request)
        {
            try
            {
                return Ok(await _motorcycleService.UpdateAsync(id, request));
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

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _motorcycleService.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }
    }
}
