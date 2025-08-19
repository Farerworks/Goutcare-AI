import React, { useState, useEffect } from 'react';
import type { GoutForecast, GoutForecastDay } from '../types';
import { generateGoutForecast } from '../services/geminiOptimized';
import { type Language, type TranslationKey } from '../translations';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, TrendingUpIcon, FileHeartIcon } from './IconComponents';
import { useDebounce } from '../hooks/useDebounce';

interface GoutForecastProps {
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
}

const weatherIconMap: { [key: string]: React.FC<{ className?: string }> } = {
  'Sunny': SunIcon,
  'Cloudy': CloudIcon,
  'Rainy': CloudRainIcon,
  'Stormy': CloudLightningIcon,
};

// Helper function to safely encode UTF-8 strings to Base64. This version uses a robust,
// cross-browser compatible method to handle Unicode characters correctly.
const utf8ToBase64 = (str: string): string => {
    try {
        return btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            })
        );
    } catch (e) {
        console.error("Failed to encode string to base64:", e);
        // Return a simple hash as a fallback to prevent crashing.
        return `fallback_${str.length}`;
    }
};


const getIndexClasses = (index: string) => {
    switch (index) {
        case 'Good':
        case '좋음':
            return {
                bg: 'bg-green-500/20',
                text: 'text-green-300',
                labelKey: 'goutIndexGood' as const
            };
        case 'Moderate':
        case '보통':
            return {
                bg: 'bg-yellow-500/20',
                text: 'text-yellow-300',
                labelKey: 'goutIndexModerate' as const
            };
        case 'Caution':
        case '주의':
            return {
                bg: 'bg-orange-500/20',
                text: 'text-orange-300',
                labelKey: 'goutIndexCaution' as const
            };
        case 'High Risk':
        case '위험':
            return {
                bg: 'bg-red-500/20',
                text: 'text-red-300',
                labelKey: 'goutIndexHighRisk' as const
            };
        default:
            return {
                bg: 'bg-zinc-700',
                text: 'text-zinc-300',
                labelKey: null
            };
    }
};

const GoutForecast: React.FC<GoutForecastProps> = ({ t, lang, healthProfileSummary }) => {  
  const [forecastData, setForecastData] = useState<GoutForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const debouncedHealthProfileSummary = useDebounce(healthProfileSummary, 30000); // Debounce for 30s

  useEffect(() => {
    const fetchForecast = async (coords?: GeolocationCoordinates) => {
      setIsLoading(true);
      setError(null);
      try {
        const location = coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined;
        
        // Improved cache key using a safe base64 hash of the health profile
        const profileHash = debouncedHealthProfileSummary ? utf8ToBase64(debouncedHealthProfileSummary).substring(0, 10) : 'none';
        const locationKeyPart = location ? `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}` : 'generic';
        const cacheKey = `goutForecast_v8_${lang}_${locationKeyPart}_${profileHash}`;
        
        const cachedData = localStorage.getItem(cacheKey);
        const now = new Date().getTime();

        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          const cacheDuration = debouncedHealthProfileSummary ? (6 * 60 * 60 * 1000) : (12 * 60 * 60 * 1000); // 6hr for personalized, 12hr for generic
          if (now - timestamp < cacheDuration) {
            setForecastData(data);
            setLocationName(data.locationName);
            setIsLoading(false);
            return;
          }
        }

        // Convert coordinates to location name using reverse geocoding
        let locationString = '';
        let displayLocationName = '';
        
        if (location) {
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=${lang}`);
            const geoData = await response.json();
            displayLocationName = geoData.city || geoData.locality || geoData.principalSubdivision || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
            locationString = displayLocationName;
          } catch (geoError) {
            console.warn('Reverse geocoding failed, using coordinates', geoError);
            locationString = `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
            displayLocationName = locationString;
          }
        }
        
        const responseJson = await generateGoutForecast(locationString, debouncedHealthProfileSummary, lang);
        const data = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
        
        if (data.forecast && data.forecast.length > 7) {
            data.forecast = data.forecast.slice(0, 7);
        }

        setForecastData(data);
        setLocationName(data.locationName);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data }));

      } catch (e: any) {
        console.error("Failed to fetch or parse gout forecast", e);
        console.error("Error type:", typeof e);
        console.error("Error details:", e);
        
        let errorMessage = '';
        if (typeof e === 'string') {
            errorMessage = e;
        } else if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'object' && e !== null) {
            errorMessage = JSON.stringify(e);
        } else {
            errorMessage = String(e);
        }

        console.error("Processed error message:", errorMessage);

        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('resource_exhausted') || errorMessage.toLowerCase().includes('quota')) {
            setError(t('forecastErrorRateLimit'));
        } else if (errorMessage.toLowerCase().includes('api') && errorMessage.toLowerCase().includes('key')) {
            setError('API 키 오류: 환경 변수를 확인해주세요');
        } else {
            setError(`${t('forecastErrorGeneral')}: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchForecast(position.coords);
        },
        (geoError) => {
          console.warn(`Geolocation error (${geoError.code}): ${geoError.message}`);
          
          let errorKey: TranslationKey;
          
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              // Differentiate between user denying permission vs. a browser policy block.
              if (geoError.message.toLowerCase().includes('policy')) {
                errorKey = 'locationErrorPolicy';
              } else {
                errorKey = 'locationErrorInstructions';
              }
              break;
            default:
              errorKey = 'locationErrorGeneral';
          }
          
          setLocationError(t(errorKey));
          fetchForecast(); // Fetch generic forecast without location
        }
      );
    } else {
      setLocationError(t('locationErrorNotSupported'));
      fetchForecast(); // Fetch generic forecast without location
    }
  }, [lang, t, debouncedHealthProfileSummary]);
  
  const renderSkeleton = () => (
     <div className="bg-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-zinc-700 rounded-md w-1/2 mb-1"></div>
        <div className="h-3 bg-zinc-700 rounded-md w-1/3 mb-4"></div>

        <div className="flex justify-between items-center text-center">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-8"></div>
                    <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
                    <div className="h-3 bg-zinc-700 rounded w-10"></div>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-700/50 flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
                 <div key={i}>
                    <div className="h-4 bg-zinc-700 rounded w-1/4 mb-2"></div>
                    <div className="bg-zinc-900/50 p-3 rounded-lg flex items-start gap-4 min-h-[80px]">
                        <div className="h-10 bg-zinc-700 rounded w-20 flex-shrink-0 mt-1"></div>
                        <div className="flex flex-col gap-2 w-full pt-1">
                            <div className="h-3 bg-zinc-700 rounded w-full"></div>
                            <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )

  if (isLoading) {
    return renderSkeleton();
  }

  if (error || !forecastData || !forecastData.forecast || forecastData.forecast.length < 2) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 text-center text-red-400">
        <p>{error || t('forecastErrorGeneral')}</p>
      </div>
    );
  }

  const todayForecast = forecastData.forecast[0];
  const tomorrowForecast = forecastData.forecast[1];

  const DetailCard: React.FC<{ title: string, data: GoutForecastDay }> = ({ title, data }) => (
    <div>
        <h4 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h4>
        <div className="bg-zinc-900/50 p-3 rounded-lg flex items-start gap-4">
            <div className={`text-5xl font-bold flex-shrink-0 w-20 text-center ${getIndexClasses(data.goutIndex).text}`}>
                {new Intl.NumberFormat(lang).format(data.goutIndexNumeric)}
            </div>
            <p className="text-sm text-zinc-400 pt-1">{data.explanation}</p>
        </div>
    </div>
  );
  
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <h3 className="flex items-center text-md font-semibold text-sky-300 mb-1">
        <TrendingUpIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {t('goutForecastTitle')}
      </h3>
      <p className="text-xs text-zinc-400 mb-3">{locationName}</p>
      
      {locationError && (
        <div className="bg-amber-900/50 border border-amber-700 text-amber-300 text-xs px-3 py-2 rounded-md mb-3 flex items-center justify-between" role="alert">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} className="ml-2 -mr-1 p-1 leading-none rounded-full hover:bg-amber-800/50" aria-label="Dismiss">
             ×
          </button>
        </div>
      )}

      <div className="flex justify-around items-start text-center">
        {forecastData.forecast.map((day, index) => {
            const WeatherIcon = weatherIconMap[day.weather] || CloudIcon;
            let dayName: string;

            if (index === 0) {
                dayName = t('today');
            } else if (index === 1) {
                dayName = t('tomorrow');
            } else {
                const dayIndex = (new Date().getDay() + index) % 7;
                dayName = t(`forecastDay${dayIndex}` as TranslationKey);
            }
            
            const {bg, text, labelKey} = getIndexClasses(day.goutIndex);

            return (
                <div key={index} className="flex flex-col items-center space-y-1 w-12 group" title={day.explanation}>
                    <p className={`text-sm font-semibold ${index === 0 ? 'text-teal-300' : 'text-zinc-300'}`}>{dayName}</p>
                    <WeatherIcon className="w-8 h-8 text-zinc-400 my-1 group-hover:scale-110 transition-transform" />
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${bg} ${text}`}>
                        {labelKey ? t(labelKey) : day.goutIndex}
                    </span>
                </div>
            );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-col gap-3">
        {forecastData.personalizedAlert && (
            <div className="p-3 bg-sky-900/50 border border-sky-800 rounded-lg flex items-start gap-3 mb-2">
                <FileHeartIcon className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-sky-300 text-sm">{t('personalizedAlertTitle')}</h4>
                    <p className="text-sm text-sky-200/90">{forecastData.personalizedAlert}</p>
                </div>
            </div>
        )}
        <DetailCard title={t('today')} data={todayForecast} />
        <DetailCard title={t('tomorrow')} data={tomorrowForecast} />
      </div>

    </div>
  );
};

export default GoutForecast;