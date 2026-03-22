using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace Shared.Common.Helpers;

/// <summary>
/// Password hashing using PBKDF2 (HMAC-SHA256). Legacy SHA256 hashes are still verified for migration.
/// </summary>
public static class PasswordHasher
{
    private const string Pbkdf2Prefix = "PBKDF2$v1$";
    private const int Iterations = 120_000;
    private const int SaltSize = 16;
    private const int SubkeySize = 32;

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var subkey = KeyDerivation.Pbkdf2(
            password,
            salt,
            KeyDerivationPrf.HMACSHA256,
            Iterations,
            SubkeySize);

        return $"{Pbkdf2Prefix}{Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(subkey)}";
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash))
            return false;

        if (storedHash.StartsWith(Pbkdf2Prefix, StringComparison.Ordinal))
            return VerifyPbkdf2(password, storedHash);

        return VerifyLegacySha256(password, storedHash);
    }

    /// <summary>Returns a PBKDF2 hash if the stored value was legacy SHA256 and password matches.</summary>
    public static string? UpgradeHashIfLegacy(string password, string storedHash)
    {
        if (storedHash.StartsWith(Pbkdf2Prefix, StringComparison.Ordinal))
            return null;
        return VerifyLegacySha256(password, storedHash) ? HashPassword(password) : null;
    }

    private static bool VerifyPbkdf2(string password, string storedHash)
    {
        try
        {
            var parts = storedHash.Split('$');
            if (parts.Length != 5 || parts[0] != "PBKDF2" || parts[1] != "v1")
                return false;

            var iterations = int.Parse(parts[2]);
            var salt = Convert.FromBase64String(parts[3]);
            var expectedSubkey = Convert.FromBase64String(parts[4]);

            var actualSubkey = KeyDerivation.Pbkdf2(
                password,
                salt,
                KeyDerivationPrf.HMACSHA256,
                iterations,
                expectedSubkey.Length);

            return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
        }
        catch
        {
            return false;
        }
    }

    private static bool VerifyLegacySha256(string password, string hashedPassword)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        var hashOfInput = Convert.ToBase64String(hashedBytes);
        var a = Encoding.UTF8.GetBytes(hashOfInput);
        var b = Encoding.UTF8.GetBytes(hashedPassword);
        if (a.Length != b.Length)
            return false;
        return CryptographicOperations.FixedTimeEquals(a, b);
    }
}
