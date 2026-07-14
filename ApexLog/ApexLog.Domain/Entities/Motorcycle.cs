using System;

namespace ApexLog.Domain.Entities
{
    public class Motorcycle
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public User? User { get; private set; }
        public string Make { get; private set; }
        public string Model { get; private set; }
        public int Year { get; private set; }
        public string Nickname { get; private set; }

        protected Motorcycle() { }

        public Motorcycle(Guid userId, string make, string model, int year, string nickname)
        {
            Id = Guid.NewGuid();
            UserId = userId != Guid.Empty ? userId : throw new ArgumentException("UserId cannot be empty.");
            Make = string.IsNullOrWhiteSpace(make) ? throw new ArgumentException("A marca é obrigatória.") : make;
            Model = string.IsNullOrWhiteSpace(model) ? throw new ArgumentException("O modelo é obrigatório.") : model;
            Year = year is >= 1900 and <= 2100 ? year : throw new ArgumentException("Ano inválido.");
            Nickname = nickname ?? string.Empty;
        }

        public void UpdateDetails(string make, string model, int year, string nickname)
        {
            Make = string.IsNullOrWhiteSpace(make) ? throw new ArgumentException("A marca é obrigatória.") : make;
            Model = string.IsNullOrWhiteSpace(model) ? throw new ArgumentException("O modelo é obrigatório.") : model;
            Year = year is >= 1900 and <= 2100 ? year : throw new ArgumentException("Ano inválido.");
            Nickname = nickname ?? string.Empty;
        }
    }
}
