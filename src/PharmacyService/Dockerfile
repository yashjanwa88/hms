# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/Shared.Common/Shared.Common.csproj", "Shared.Common/"]
COPY ["src/Shared.EventBus/Shared.EventBus.csproj", "Shared.EventBus/"]
COPY ["src/PharmacyService/PharmacyService.csproj", "PharmacyService/"]

RUN dotnet restore "PharmacyService/PharmacyService.csproj"

COPY src/Shared.Common/. Shared.Common/
COPY src/Shared.EventBus/. Shared.EventBus/
COPY src/PharmacyService/. PharmacyService/

WORKDIR "/src/PharmacyService"
RUN dotnet build "PharmacyService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PharmacyService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5006

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "PharmacyService.dll"]
