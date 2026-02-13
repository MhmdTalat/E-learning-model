using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ELearningModels.DTO;
using ELearningModels.Iservice;
using ELearningModels.model;
using ELearningModels.Data;

namespace ELearningModels.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InstructorController : ControllerBase
    {
        private readonly IInstructorService _service;
        private readonly AppDbContext _context;

        public InstructorController(IInstructorService service, AppDbContext context)
        {
            _service = service;
            _context = context;
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

            return Ok(result);
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

        // GET: api/instructor-courses
        [HttpGet("courses")]
        public async Task<IActionResult> GetInstructorCourses()
        {
            var courses = await _service.GetInstructorCoursesAsync();
            return Ok(courses);
        }

        // GET: api/instructor/5/available-courses
        [HttpGet("{id}/available-courses")]
        public async Task<IActionResult> GetAvailableCourses(int id)
        {
            try
            {
                var courses = await _service.GetAvailableCoursesAsync(id);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // POST: api/instructor-courses/assign
        [HttpPost("courses/assign")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> AssignCourse([FromBody] AssignCourseDto dto)
        {
            try
            {
                if (dto.InstructorID <= 0 || dto.CourseID <= 0)
                    return BadRequest(new { message = "Invalid instructor or course ID" });

                await _service.AssignCourseAsync(dto.InstructorID, dto.CourseID);
                return Ok(new { message = "Course assigned successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/instructor-courses/5
        [HttpDelete("courses/{id}")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<IActionResult> RemoveEnrollment(int id)
        {
            var result = await _service.RemoveEnrollmentAsync(id);
            if (!result)
                return NotFound(new { message = "Enrollment not found" });

            return Ok(new { message = "Enrollment removed successfully" });
        }
    }
}
