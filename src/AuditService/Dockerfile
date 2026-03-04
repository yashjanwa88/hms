FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5011

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/AuditService/AuditService.csproj", "AuditService/"]
COPY ["src/Shared/Common/Shared.Common.csproj", "Shared/Common/"]
RUN dotnet restore "AuditService/AuditService.csproj"
COPY src/AuditService/ AuditService/
COPY src/Shared/ Shared/
WORKDIR "/src/AuditService"
RUN dotnet build "AuditService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AuditService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuditService.dll"]
