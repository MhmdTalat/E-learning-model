using ELearningModels.model;

namespace ELearningModels.Iservice
{
    public interface ITokenService
    {
        Task<string> CreateTokenAsync(ApplicationUser user);
    }
}
