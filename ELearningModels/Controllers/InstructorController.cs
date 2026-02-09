using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ELearningModels.DTO;
using ELearningModels.Iservice;
using ELearningModels.model;

namespace ELearningModels.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InstructorController : ControllerBase
    {
        private readonly IInstructorService _service;

        public InstructorController(IInstructorService service)
        {
            _service = service;
        }

        // GET: api/instructor
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var instructors = await _service.GetAllAsync();
            return Ok(instructors);
        }

        // GET: api/instructor/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var instructor = await _service.GetByIdAsync(id);
            if (instructor == null)
                return NotFound(new { message = "Instructor not found" });

            return Ok(instructor);
        }

        // POST: api/instructor
        [HttpPost]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Create([FromBody] InstructorCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.InstructorID }, result);
        }

        // PUT: api/instructor/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] InstructorCreateDto dto)
        {
            if (id != dto.InstructorID)
                return BadRequest(new { message = "ID in URL and body must match" });

            var result = await _service.UpdateAsync(dto);
            if (result == null)
                return NotFound(new { message = "Instructor not found" });

            return Ok(result);  // or return NoContent() if you prefer
        }

        // DELETE: api/instructor/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result)
                return NotFound(new { message = "Instructor not found" });

            return Ok(new { message = "Instructor deleted successfully" });
        }
    }
}
