using ELearningModels.DTO;
using ELearningModels.model;

namespace ELearningModels.Iservice
{
    public interface ICourseService
    {
        Task<IEnumerable<Course>> GetAllAsync();
        Task<Course> CreateAsync(CourseCreateDto dto);
        Task<Course?> UpdateAsync(CourseCreateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
