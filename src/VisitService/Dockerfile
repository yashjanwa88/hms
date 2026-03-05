FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5008

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/VisitService/VisitService.csproj", "src/VisitService/"]
COPY ["src/Shared/Common/Shared.Common.csproj", "src/Shared/Common/"]
COPY ["src/Shared/EventBus/Shared.EventBus.csproj", "src/Shared/EventBus/"]
RUN dotnet restore "src/VisitService/VisitService.csproj"
COPY . .
WORKDIR "/src/src/VisitService"
RUN dotnet build "VisitService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VisitService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VisitService.dll"]