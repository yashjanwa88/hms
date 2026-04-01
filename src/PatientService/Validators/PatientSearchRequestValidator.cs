using FluentValidation;
using PatientService.DTOs;

namespace PatientService.Validators;

public class PatientSearchRequestValidator : AbstractValidator<PatientSearchRequest>
{
    public PatientSearchRequestValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        
        RuleFor(x => x.SearchTerm)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));

        RuleFor(x => x.UHID)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.UHID));

        RuleFor(x => x.MobileNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .When(x => !string.IsNullOrEmpty(x.MobileNumber))
            .WithMessage("Invalid mobile number format");
    }
}
