using ELearningModels.DTO;

namespace ELearningModels.Iservice
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<string> ForgotPasswordAsync(string email);
        Task ResetPasswordAsync(ResetPasswordDto dto);
        Task<dynamic> GetCurrentUserAsync(string userId);
    }
}
