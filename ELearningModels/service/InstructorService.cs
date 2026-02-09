using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ELearningModels.Data;
using ELearningModels.DTO;
using ELearningModels.Iservice;
using ELearningModels.model;

namespace ELearningModels.service
{
    public class InstructorService : IInstructorService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public InstructorService(AppDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }

        public async Task<IEnumerable<Instructor>> GetAllAsync()
        {
            return await _context.Instructors
                .Include(i => i.Department)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<InstructorCreateDto?> GetByIdAsync(int id)
        {
            return await _context.Instructors
                .AsNoTracking()
                .Where(i => i.InstructorID == id)
                .Select(i => new InstructorCreateDto
                {
                    InstructorID = i.InstructorID,
                    FirstMidName = i.FirstMidName,
                    LastName = i.LastName,
                    HireDate = i.HireDate,
                    DepartmentID = i.DepartmentID,
                    DepartmentName = i.Department != null ? i.Department.Name : null
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Instructor> CreateAsync(InstructorCreateDto dto)
        {
            if (dto.DepartmentID != null)
            {
                var deptExists = await _context.Departments.AnyAsync(d => d.DepartmentID == dto.DepartmentID);
                if (!deptExists)
                    throw new Exception("Department not found.");
            }

            var instructor = _mapper.Map<Instructor>(dto) ?? new Instructor
            {
                FirstMidName = dto.FirstMidName,
                LastName = dto.LastName,
                HireDate = dto.HireDate,
                DepartmentID = dto.DepartmentID,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Password = dto.Password
            };

            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();

            // Update Department with InstructorID if instructor is assigned to a department
            if (dto.DepartmentID != null)
            {
                var department = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == dto.DepartmentID);
                if (department != null && department.InstructorID == null)
                {
                    // Set the first instructor of the department as the administrator
                    department.InstructorID = instructor.InstructorID;
                    _context.Departments.Update(department);
                    await _context.SaveChangesAsync();
                }
            }

            // Check if user already exists (e.g. created by AuthService during register-as-instructor)
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                // User was already created (e.g. by AuthService.RegisterAsync); just ensure they have Instructor role
                if (!await _userManager.IsInRoleAsync(existingUser, "Instructor"))
                    await _userManager.AddToRoleAsync(existingUser, "Instructor");
                return instructor;
            }

            // Create ApplicationUser for the instructor (Admin-created flow)
            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                FirstMidName = dto.FirstMidName,
                LastName = dto.LastName,
                EnrollmentDate = dto.HireDate, // Use HireDate as EnrollmentDate
                RoleType = UserRoleType.Instructor
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                throw new Exception(string.Join(",", result.Errors.Select(e => e.Description)));

            // Add to Instructor role
            if (!await _userManager.IsInRoleAsync(user, "Instructor"))
            {
                await _userManager.AddToRoleAsync(user, "Instructor");
            }

            return instructor;
        }

        public async Task<InstructorCreateDto?> UpdateAsync(InstructorCreateDto dto)
        {
            var instructor = await _context.Instructors
                .FirstOrDefaultAsync(i => i.InstructorID == dto.InstructorID);

            if (instructor == null)
                return null;

            if (dto.DepartmentID != null)
            {
                var deptExists = await _context.Departments.AnyAsync(d => d.DepartmentID == dto.DepartmentID);
                if (!deptExists)
                    throw new Exception("Department not found.");
            }

            // If department is being changed, update the departments accordingly
            int? oldDepartmentID = instructor.DepartmentID;

            var oldEmail = instructor.Email;
            instructor.FirstMidName = dto.FirstMidName;
            instructor.LastName = dto.LastName;
            instructor.HireDate = dto.HireDate;
            instructor.DepartmentID = dto.DepartmentID;
            instructor.Email = dto.Email;
            instructor.PhoneNumber = dto.PhoneNumber;
            if (!string.IsNullOrWhiteSpace(dto.Password) && dto.Password != "KEEP_CURRENT_PASSWORD")
                instructor.Password = dto.Password;

            await _context.SaveChangesAsync();

            // Update Department InstructorID if department changed
            if (dto.DepartmentID != null && dto.DepartmentID != oldDepartmentID)
            {
                // Set new department's administrator
                var newDept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == dto.DepartmentID);
                if (newDept != null && newDept.InstructorID == null)
                {
                    newDept.InstructorID = instructor.InstructorID;
                    _context.Departments.Update(newDept);
                }

                // Clear old department's administrator if this was the admin
                if (oldDepartmentID != null)
                {
                    var oldDept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == oldDepartmentID);
                    if (oldDept != null && oldDept.InstructorID == instructor.InstructorID)
                    {
                        oldDept.InstructorID = null;
                        _context.Departments.Update(oldDept);
                    }
                }

                await _context.SaveChangesAsync();
            }

            // Update ApplicationUser if exists
            var user = await _userManager.FindByEmailAsync(oldEmail);
            if (user != null)
            {
                user.FirstMidName = dto.FirstMidName;
                user.LastName = dto.LastName;
                user.Email = dto.Email;
                user.UserName = dto.Email; // Update username if email changed
                user.PhoneNumber = dto.PhoneNumber;
                user.EnrollmentDate = dto.HireDate;

                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                    throw new Exception(string.Join(",", updateResult.Errors.Select(e => e.Description)));

                // Update password if provided (skip placeholder used when client does not want to change)
                if (!string.IsNullOrEmpty(dto.Password) && dto.Password != "KEEP_CURRENT_PASSWORD")
                {
                    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var passwordResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
                    if (!passwordResult.Succeeded)
                        throw new Exception(string.Join(",", passwordResult.Errors.Select(e => e.Description)));
                }
            }

            return await _context.Instructors
                .AsNoTracking()
                .Where(i => i.InstructorID == dto.InstructorID)
                .Select(i => new InstructorCreateDto
                {
                    InstructorID = i.InstructorID,
                    FirstMidName = i.FirstMidName,
                    LastName = i.LastName,
                    HireDate = i.HireDate,
                    DepartmentID = i.DepartmentID,
                    DepartmentName = i.Department != null ? i.Department.Name : null
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null)
                return false;

            // Delete ApplicationUser if exists
            var user = await _userManager.FindByEmailAsync(instructor.Email);
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }

            _context.Instructors.Remove(instructor);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
