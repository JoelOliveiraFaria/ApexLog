using System;

namespace ApexLog.Domain.Entities
{
    public class User
    {
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string Email { get; private set; }
        public string PasswordHash { get; private set; }
        public DateTime CreatedAt { get; private set; }

        protected User() { }

        public User(string name, string email, string passwordHash, DateTime createdAt)
        {
            Id = Guid.NewGuid();
            Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("O nome é obrigatório.") : name;
            Email = IsValidEmail(email) ? email : throw new ArgumentException("Invalid email format.");
            PasswordHash = string.IsNullOrWhiteSpace(passwordHash) ? throw new ArgumentException("Password hash cannot be empty.") : passwordHash;
            CreatedAt = createdAt;
        }

        private static bool IsValidEmail(string email)
        {
            return !string.IsNullOrWhiteSpace(email) && email.Contains('@') && email.Contains('.');
        }

        public void UpdatePasswordHash(string passwordHash)
        {
            PasswordHash = string.IsNullOrWhiteSpace(passwordHash) ? throw new ArgumentException("Password hash cannot be empty.") : passwordHash;
        }
    }
}
