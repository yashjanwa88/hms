import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Phone, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { patientService } from '../services/patientService';
import { useDebounce } from '@/hooks/useDebounce';

interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  mobileNumber: string;
  age: number;
  gender: string;
}

interface PatientSearchProps {
  onPatientSelect?: (patient: Patient) => void;
  placeholder?: string;
  showRecentPatients?: boolean;
}

export function PatientSearch({ onPatientSelect, placeholder = "Search by Name, ID, or Phone...", showRecentPatients = true }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Quick search for auto-suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['patients', 'quick-search', debouncedSearchTerm],
    queryFn: () => patientService.quickSearch(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 30000,
  });

  // Recent patients
  const { data: recentPatients = [] } = useQuery({
    queryKey: ['patients', 'recent'],
    queryFn: () => patientService.getRecentPatients(10),
    enabled: showRecentPatients,
    staleTime: 60000,
  });

  const displayItems = searchTerm.length >= 2 ? suggestions : (showRecentPatients ? recentPatients : []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || displayItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < displayItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : displayItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handlePatientSelect(displayItems[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSearchTerm(patient.fullName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onPatientSelect?.(patient);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && displayItems.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto z-50 shadow-lg">
          {searchTerm.length < 2 && showRecentPatients && (
            <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
              Recent Patients
            </div>
          )}
          {displayItems.map((patient, index) => (
            <div
              key={patient.id}
              className={`px-3 py-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handlePatientSelect(patient)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{patient.fullName}</span>
                    <span className="text-xs text-gray-500">({patient.uhid})</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.mobileNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {patient.age}y, {patient.gender}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}