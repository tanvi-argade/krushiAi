import math

def calculate_eto(tmax, tmin, humidity, wind_speed, 
                  solar_radiation, elevation, doy):
    """
    FAO-56 Penman-Monteith Reference Evapotranspiration
    
    Parameters:
    - tmax, tmin: max and min temperature (Celsius)
    - humidity: relative humidity (%)
    - wind_speed: wind speed at 2m height (m/s)
    - solar_radiation: solar radiation (MJ/m2/day)
    - elevation: elevation above sea level (meters)
    - doy: day of year (1-365)
    
    Returns: ETo in mm/day
    """
    
    # Mean temperature
    tmean = (tmax + tmin) / 2
    
    # Atmospheric pressure (kPa) based on elevation
    P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
    
    # Psychrometric constant
    gamma = 0.000665 * P
    
    # Saturation vapour pressure
    es_tmax = 0.6108 * math.exp(17.27 * tmax / (tmax + 237.3))
    es_tmin = 0.6108 * math.exp(17.27 * tmin / (tmin + 237.3))
    es = (es_tmax + es_tmin) / 2
    
    # Actual vapour pressure from humidity
    ea = humidity / 100 * es
    
    # Vapour pressure deficit
    vpd = es - ea
    
    # Slope of saturation vapour pressure curve
    delta = 4098 * es / (tmean + 237.3) ** 2
    
    # Net radiation (convert solar radiation to net)
    Rns = (1 - 0.23) * solar_radiation  # net shortwave
    
    # Stefan-Boltzmann constant
    sigma = 4.903e-9
    
    # Net longwave radiation
    Rnl = sigma * ((tmax + 273.16)**4 + (tmin + 273.16)**4) / 2 * \
          (0.34 - 0.14 * math.sqrt(ea)) * \
          (1.35 * solar_radiation / (0.75 * solar_radiation + 0.001) - 0.35)
    
    Rn = Rns - Rnl
    
    # Soil heat flux (assume 0 for daily)
    G = 0
    
    # Wind speed adjustment to 2m if needed (assume already at 2m)
    u2 = wind_speed
    
    # Penman-Monteith equation
    numerator = (0.408 * delta * (Rn - G) + 
                 gamma * (900 / (tmean + 273)) * u2 * vpd)
    denominator = delta + gamma * (1 + 0.34 * u2)
    
    eto = numerator / denominator
    
    return max(0, round(eto, 2))


def get_kc_for_stage(crop_kc, days_since_sowing):
    """
    Get crop coefficient Kc for current growth stage
    using FAO-56 linear interpolation
    """
    stage_days = crop_kc['stage_days']
    kc_ini = crop_kc['kc_ini']
    kc_mid = crop_kc['kc_mid']
    kc_end = crop_kc['kc_end']
    
    s1 = stage_days[0]  # initial
    s2 = stage_days[1]  # development
    s3 = stage_days[2]  # mid
    s4 = stage_days[3]  # late
    
    total = s1 + s2 + s3 + s4
    
    if days_since_sowing < 0:
        return kc_ini, "pre-sowing"
    elif days_since_sowing <= s1:
        return kc_ini, "initial"
    elif days_since_sowing <= s1 + s2:
        # Linear interpolation during development
        progress = (days_since_sowing - s1) / s2
        kc = kc_ini + progress * (kc_mid - kc_ini)
        return round(kc, 3), "development"
    elif days_since_sowing <= s1 + s2 + s3:
        return kc_mid, "mid-season"
    elif days_since_sowing <= total:
        # Linear interpolation during late stage
        progress = (days_since_sowing - s1 - s2 - s3) / s4
        kc = kc_mid + progress * (kc_end - kc_mid)
        return round(kc, 3), "late"
    else:
        return kc_end, "harvest"


def calculate_raw_available_water(soil_props, root_depth_m):
    """
    Total Available Water in root zone (mm)
    TAW = (FC - WP) * root_depth * 1000
    """
    fc = soil_props['field_capacity_mm_per_m']
    wp = soil_props['wilting_point_mm_per_m']
    taw = (fc - wp) * root_depth_m
    return round(taw, 1)


def calculate_irrigation_depth(eto, kc, rainfall, 
                                soil_props, root_depth_m):
    """
    Calculate net irrigation requirement (mm)
    NIR = ETc - effective_rainfall
    ETc = ETo x Kc
    """
    etc = eto * kc  # crop evapotranspiration
    
    # Effective rainfall (75% of actual rainfall is effective)
    eff_rain = rainfall * 0.75
    
    # Net irrigation requirement
    nir = etc - eff_rain
    
    # Readily Available Water threshold
    taw = calculate_raw_available_water(soil_props, root_depth_m)
    p = soil_props['depletion_fraction']
    raw = p * taw  # Readily Available Water
    
    return {
        "etc_mm": round(etc, 2),
        "effective_rainfall_mm": round(eff_rain, 2),
        "net_irrigation_required_mm": round(max(0, nir), 2),
        "readily_available_water_mm": round(raw, 2),
        "irrigation_needed": nir > 0
    }
