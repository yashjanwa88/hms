FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AppointmentService.csproj", "./"]
COPY ["../Shared/Common/Shared.Common.csproj", "../Shared/Common/"]
COPY ["../Shared/EventBus/Shared.EventBus.csproj", "../Shared/EventBus/"]
RUN dotnet restore "AppointmentService.csproj"
COPY . .
RUN dotnet build "AppointmentService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AppointmentService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AppointmentService.dll"]
