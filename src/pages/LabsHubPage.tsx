import React from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LAB_DEFINITIONS } from '../data/labsMeta';
import { AnatomyLab } from '../labs/Anatomy/AnatomyLab';
import { AnimalPhysiologyLab } from '../labs/AnimalPhysiology/AnimalPhysiologyLab';
import { CellLab } from '../labs/Cell/CellLab';
import { CellDivisionLab } from '../labs/CellDivision/CellDivisionLab';
import { EcologyLab } from '../labs/Ecology/EcologyLab';
import { EvolutionLab } from '../labs/Evolution/EvolutionLab';
import { ExperimentsLab } from '../labs/Experiments/ExperimentsLab';
import { GeneticsLab } from '../labs/Genetics/GeneticsLab';
import { MolecularBiologyLab } from '../labs/MolecularBiology/MolecularBiologyLab';
import { MolecularViewerLab } from '../labs/MolecularViewer/MolecularViewerLab';
import { PlantPhysiologyLab } from '../labs/PlantPhysiology/PlantPhysiologyLab';
import { RespirationSystemLab } from '../labs/Respiration/RespirationSystemLab';
import { VirusLab } from '../labs/Virus/VirusLab';
import { RespirationSimId } from '../data/respiration/respirationTypes';
import { LabId } from '../types/biology';

interface LabsHubPageProps {
  activeLabId: LabId;
  initialRespirationSimId?: RespirationSimId;
  onSelectLab: (labId: LabId, simId?: RespirationSimId) => void;
}

export const LabsHubPage: React.FC<LabsHubPageProps> = ({
  activeLabId,
  initialRespirationSimId,
  onSelectLab,
}) => {
  const renderLab = () => {
    switch (activeLabId) {
      case 'anatomy':
        return (
          <AnatomyLab
            onOpenRespiration={(simId) => onSelectLab('respiration', simId)}
          />
        );
      case 'cell':
        return <CellLab />;
      case 'virus':
        return <VirusLab />;
      case 'molecular-bio':
        return <MolecularBiologyLab />;
      case 'molecular-viewer':
        return <MolecularViewerLab />;
      case 'cell-division':
        return <CellDivisionLab />;
      case 'plant-physiology':
        return <PlantPhysiologyLab />;
      case 'animal-physiology':
        return <AnimalPhysiologyLab />;
      case 'genetics':
        return <GeneticsLab />;
      case 'evolution':
        return <EvolutionLab />;
      case 'ecology':
        return <EcologyLab />;
      case 'experiments':
        return <ExperimentsLab />;
      case 'respiration':
        return <RespirationSystemLab initialSimId={initialRespirationSimId} />;
      default:
        return <CellLab />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Switcher across all 13 Labs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-bold text-slate-900 text-ui-page">Phòng Thí nghiệm Sinh học 3D</h1>
          <span className="text-slate-600 text-ui-min">Chọn một trong {LAB_DEFINITIONS.length} phòng Lab tương tác</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LAB_DEFINITIONS.map((lab) => {
            const active = lab.id === activeLabId;
            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => onSelectLab(lab.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-semibold text-ui-min transition-colors ${
                  active
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {lab.number} · {lab.title}
              </button>
            );
          })}
        </div>
      </div>

      <ErrorBoundary key={activeLabId} fallbackTitle="Không thể khởi tạo Phòng Lab này">
        {renderLab()}
      </ErrorBoundary>
    </div>
  );
};
