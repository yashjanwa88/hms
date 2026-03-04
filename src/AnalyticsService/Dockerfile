FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AnalyticsService/AnalyticsService.csproj", "AnalyticsService/"]
COPY ["Shared.Common/Shared.Common.csproj", "Shared.Common/"]
RUN dotnet restore "AnalyticsService/AnalyticsService.csproj"
COPY . .
WORKDIR "/src/AnalyticsService"
RUN dotnet build "AnalyticsService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AnalyticsService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AnalyticsService.dll"]
