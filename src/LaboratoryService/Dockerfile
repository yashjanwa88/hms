# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["src/Shared.Common/Shared.Common.csproj", "Shared.Common/"]
COPY ["src/Shared.EventBus/Shared.EventBus.csproj", "Shared.EventBus/"]

# Copy service project
COPY ["src/LaboratoryService/LaboratoryService.csproj", "LaboratoryService/"]

# Restore dependencies
RUN dotnet restore "LaboratoryService/LaboratoryService.csproj"

# Copy source code
COPY src/Shared.Common/. Shared.Common/
COPY src/Shared.EventBus/. Shared.EventBus/
COPY src/LaboratoryService/. LaboratoryService/

# Build
WORKDIR "/src/LaboratoryService"
RUN dotnet build "LaboratoryService.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "LaboratoryService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5007

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "LaboratoryService.dll"]
