using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Shared.Common.Services;

public interface IDatabaseMigrationService
{
    Task RunMigrationsAsync();
}

public class DatabaseMigrationService : IDatabaseMigrationService
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseMigrationService> _logger;

    public DatabaseMigrationService(IConfiguration configuration, ILogger<DatabaseMigrationService> logger, string connectionStringKey = "DefaultConnection")
    {
        _connectionString = configuration.GetConnectionString(connectionStringKey)!;
        _logger = logger;
    }

    public async Task RunMigrationsAsync()
    {
        await EnsureMigrationTableExistsAsync();
        await RunPendingMigrationsAsync();
    }

    private async Task EnsureMigrationTableExistsAsync()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        
        const string sql = @"
            CREATE TABLE IF NOT EXISTS __migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL UNIQUE,
                script_name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP NOT NULL DEFAULT NOW()
            );";
        
        await connection.ExecuteAsync(sql);
    }

    private async Task RunPendingMigrationsAsync()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var scriptsPath = Path.Combine(baseDir, "scripts");
        if (!Directory.Exists(scriptsPath))
            scriptsPath = Path.Combine(baseDir, "..", "..", "..", "scripts");

        if (!Directory.Exists(scriptsPath))
        {
            _logger.LogWarning("Scripts directory not found (tried output and project-relative paths).");
            return;
        }

        var sqlFiles = Directory.GetFiles(scriptsPath, "*.sql").OrderBy(f => f).ToList();

        using var connection = new NpgsqlConnection(_connectionString);

        foreach (var file in sqlFiles)
        {
            var fileName = Path.GetFileName(file);
            var version = Path.GetFileNameWithoutExtension(fileName);

            var exists = await connection.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM __migrations WHERE version = @Version)",
                new { Version = version }
            );

            if (!exists)
            {
                _logger.LogInformation("Running migration: {FileName}", fileName);
                
                var script = await File.ReadAllTextAsync(file);
                await connection.ExecuteAsync(script);

                await connection.ExecuteAsync(
                    "INSERT INTO __migrations (version, script_name) VALUES (@Version, @ScriptName)",
                    new { Version = version, ScriptName = fileName }
                );

                _logger.LogInformation("Migration completed: {FileName}", fileName);
            }
        }
    }
}
