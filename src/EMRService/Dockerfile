FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5008

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EMRService.csproj", "./"]
RUN dotnet restore "EMRService.csproj"
COPY . .
RUN dotnet build "EMRService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EMRService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EMRService.dll"]
