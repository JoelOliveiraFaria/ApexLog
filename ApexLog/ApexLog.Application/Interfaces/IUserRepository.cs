using ApexLog.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ApexLog.Application.Interfaces
{
    public interface IUserRepository
    {
        Task AddAsync(User user);
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task<bool> EmailExistsAsync(string email);
        Task SaveChangesAsync();
    }
}