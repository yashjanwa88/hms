import React from 'react';
import { PatientBarcodeGenerator } from '../components/PatientBarcodeGenerator';

export const PatientBarcodeGeneratorPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <PatientBarcodeGenerator />
    </div>
  );
};
