FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/IPDService/IPDService.csproj", "src/IPDService/"]
COPY ["src/Shared/Common/Shared.Common.csproj", "src/Shared/Common/"]
COPY ["src/Shared/EventBus/Shared.EventBus.csproj", "src/Shared/EventBus/"]
RUN dotnet restore "src/IPDService/IPDService.csproj"
COPY . .
WORKDIR "/src/src/IPDService"
RUN dotnet build "IPDService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IPDService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IPDService.dll"]
