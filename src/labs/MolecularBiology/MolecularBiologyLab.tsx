import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ModelViewer3D, SceneUpdateContext } from '../../components/viewer3d/ModelViewer3D';
import { LabWorkspaceLayout } from '../../components/viewer3d/LabWorkspaceLayout';
import { useLabViewerState } from '../../hooks/useLabViewerState';
import { ModelPartInfo, QualityLevel, ScientificSourceMeta } from '../../types/biology';

type MolBioMode = 'helix' | 'replication' | 'transcription' | 'translation' | 'operon-lac';
type ReadingMode = 'start-aug' | 'direct-codons';
type MutationType = 'none' | 'substitute' | 'delete' | 'insert';

export const BASE_COLORS = {
  A: '#22C55E', // Emerald
  T: '#F59E0B', // Amber
  G: '#2563EB', // Blue
  C: '#EF4444', // Red
  U: '#8B5CF6', // Violet
} as const;

const CODON_TABLE: Record<string, { aa: string; abbr: string; full: string }> = {
  UUU: { aa: 'Phe', abbr: 'F', full: 'Phenylalanine' },
  UUC: { aa: 'Phe', abbr: 'F', full: 'Phenylalanine' },
  UUA: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  UUG: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  CUU: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  CUC: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  CUA: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  CUG: { aa: 'Leu', abbr: 'L', full: 'Leucine' },
  AUU: { aa: 'Ile', abbr: 'I', full: 'Isoleucine' },
  AUC: { aa: 'Ile', abbr: 'I', full: 'Isoleucine' },
  AUA: { aa: 'Ile', abbr: 'I', full: 'Isoleucine' },
  AUG: { aa: 'Met', abbr: 'M', full: 'Methionine (Mở đầu)' },
  GUU: { aa: 'Val', abbr: 'V', full: 'Valine' },
  GUC: { aa: 'Val', abbr: 'V', full: 'Valine' },
  GUA: { aa: 'Val', abbr: 'V', full: 'Valine' },
  GUG: { aa: 'Val', abbr: 'V', full: 'Valine' },
  UCU: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  UCC: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  UCA: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  UCG: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  AGU: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  AGC: { aa: 'Ser', abbr: 'S', full: 'Serine' },
  CCU: { aa: 'Pro', abbr: 'P', full: 'Proline' },
  CCC: { aa: 'Pro', abbr: 'P', full: 'Proline' },
  CCA: { aa: 'Pro', abbr: 'P', full: 'Proline' },
  CCG: { aa: 'Pro', abbr: 'P', full: 'Proline' },
  ACU: { aa: 'Thr', abbr: 'T', full: 'Threonine' },
  ACC: { aa: 'Thr', abbr: 'T', full: 'Threonine' },
  ACA: { aa: 'Thr', abbr: 'T', full: 'Threonine' },
  ACG: { aa: 'Thr', abbr: 'T', full: 'Threonine' },
  GCU: { aa: 'Ala', abbr: 'A', full: 'Alanine' },
  GCC: { aa: 'Ala', abbr: 'A', full: 'Alanine' },
  GCA: { aa: 'Ala', abbr: 'A', full: 'Alanine' },
  GCG: { aa: 'Ala', abbr: 'A', full: 'Alanine' },
  UAU: { aa: 'Tyr', abbr: 'Y', full: 'Tyrosine' },
  UAC: { aa: 'Tyr', abbr: 'Y', full: 'Tyrosine' },
  UAA: { aa: 'STOP', abbr: '*', full: 'Mã kết thúc (không mã hóa amino acid)' },
  UAG: { aa: 'STOP', abbr: '*', full: 'Mã kết thúc (không mã hóa amino acid)' },
  UGA: { aa: 'STOP', abbr: '*', full: 'Mã kết thúc (không mã hóa amino acid)' },
  CAU: { aa: 'His', abbr: 'H', full: 'Histidine' },
  CAC: { aa: 'His', abbr: 'H', full: 'Histidine' },
  CAA: { aa: 'Gln', abbr: 'Q', full: 'Glutamine' },
  CAG: { aa: 'Gln', abbr: 'Q', full: 'Glutamine' },
  AAU: { aa: 'Asn', abbr: 'N', full: 'Asparagine' },
  AAC: { aa: 'Asn', abbr: 'N', full: 'Asparagine' },
  AAA: { aa: 'Lys', abbr: 'K', full: 'Lysine' },
  AAG: { aa: 'Lys', abbr: 'K', full: 'Lysine' },
  GAU: { aa: 'Asp', abbr: 'D', full: 'Aspartic acid' },
  GAC: { aa: 'Asp', abbr: 'D', full: 'Aspartic acid' },
  GAA: { aa: 'Glu', abbr: 'E', full: 'Glutamic acid' },
  GAG: { aa: 'Glu', abbr: 'E', full: 'Glutamic acid' },
  UGU: { aa: 'Cys', abbr: 'C', full: 'Cysteine' },
  UGC: { aa: 'Cys', abbr: 'C', full: 'Cysteine' },
  UGG: { aa: 'Trp', abbr: 'W', full: 'Tryptophan' },
  CGU: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  CGC: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  CGA: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  CGG: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  AGA: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  AGG: { aa: 'Arg', abbr: 'R', full: 'Arginine' },
  GGU: { aa: 'Gly', abbr: 'G', full: 'Glycine' },
  GGC: { aa: 'Gly', abbr: 'G', full: 'Glycine' },
  GGA: { aa: 'Gly', abbr: 'G', full: 'Glycine' },
  GGG: { aa: 'Gly', abbr: 'G', full: 'Glycine' },
};

function complementDnaBase(b: string): string {
  if (b === 'A') return 'T';
  if (b === 'T') return 'A';
  if (b === 'G') return 'C';
  if (b === 'C') return 'G';
  return '?';
}

function transcribeTemplateToMrna(templateBase: string): string {
  if (templateBase === 'A') return 'U';
  if (templateBase === 'T') return 'A';
  if (templateBase === 'G') return 'C';
  if (templateBase === 'C') return 'G';
  return '?';
}

function translateMrna(mrna: string, mode: ReadingMode) {
  let startIndex = 0;
  let foundStart = true;
  if (mode === 'start-aug') {
    const augIdx = mrna.indexOf('AUG');
    if (augIdx === -1) {
      return { codons: [], aminoAcids: [], stopped: false, foundStart: false, remainder: mrna.length % 3 };
    }
    startIndex = augIdx;
  }

  const codons: string[] = [];
  const aminoAcids: string[] = [];
  let stopped = false;

  for (let i = startIndex; i + 3 <= mrna.length; i += 3) {
    const codon = mrna.slice(i, i + 3);
    codons.push(codon);
    const info = CODON_TABLE[codon];
    if (!info) continue;
    if (info.aa === 'STOP') {
      stopped = true;
      break;
    }
    aminoAcids.push(info.aa);
  }

  const usedLen = codons.length * 3;
  const remainder = (mrna.length - startIndex - usedLen) % 3;
  return { codons, aminoAcids, stopped, foundStart, remainder: stopped ? 0 : Math.max(0, remainder) };
}

const HELIX_PARTS: ModelPartInfo[] = [
  { id: 'backbone', vietnameseName: 'Khung Đường–Phosphate (5′→3′ & 3′→5′)', scientificName: 'Deoxyribose–Phosphate Backbone', location: 'Hai mạch xoắn ngoài đối song song', structure: 'Đường deoxyribose (5C) nối nhóm phosphate qua liên kết phosphodiester.', function: 'Tạo khung bền vững cho phân tử DNA.', relatedLessons: ['DNA và gene'], colorHex: '#0EA5E9' },
  { id: 'base-A', vietnameseName: 'Nitrogenous base Adenine (A)', scientificName: 'Adenine', location: 'Hướng vào lõi mạch kép', structure: 'Bazơ lớn (Purine), bắt cặp bổ sung với Thymine (T).', function: 'Mã hóa thông tin di truyền, liên kết với T bằng 2 liên kết hydrogen.', relatedLessons: ['Cấu trúc DNA'], colorHex: BASE_COLORS.A },
  { id: 'base-T', vietnameseName: 'Nitrogenous base Thymine (T)', scientificName: 'Thymine', location: 'Hướng vào lõi mạch kép', structure: 'Bazơ bé (Pyrimidine), chỉ có ở DNA.', function: 'Liên kết bổ sung với Adenine (A) bằng 2 liên kết hydrogen.', relatedLessons: ['Cấu trúc DNA'], colorHex: BASE_COLORS.T },
  { id: 'base-G', vietnameseName: 'Nitrogenous base Guanine (G)', scientificName: 'Guanine', location: 'Hướng vào lõi mạch kép', structure: 'Bazơ lớn (Purine), bắt cặp với Cytosine (C).', function: 'Liên kết với C bằng 3 liên kết hydrogen.', relatedLessons: ['Cấu trúc DNA'], colorHex: BASE_COLORS.G },
  { id: 'base-C', vietnameseName: 'Nitrogenous base Cytosine (C)', scientificName: 'Cytosine', location: 'Hướng vào lõi mạch kép', structure: 'Bazơ bé (Pyrimidine).', function: 'Liên kết bổ sung với Guanine (G) bằng 3 liên kết hydrogen.', relatedLessons: ['Cấu trúc DNA'], colorHex: BASE_COLORS.C },
  { id: 'hbonds', vietnameseName: 'Liên kết Hydrogen (A=T: 2 lk; G≡C: 3 lk)', scientificName: 'Hydrogen Bonds', location: 'Giữa hai base đối diện', structure: 'Liên kết yếu nhưng số lượng lớn giúp DNA bền vững và dễ tách mạch.', function: 'Giữ hai mạch đơn DNA liên kết linh hoạt phục vụ tái bản và phiên mã.', relatedLessons: ['Tái bản DNA'], colorHex: '#E2E8F0' },
];

export const MolecularBiologyLab: React.FC<{
  isPresentation?: boolean;
  onTogglePresentation?: () => void;
}> = ({ isPresentation, onTogglePresentation }) => {
  const viewer = useLabViewerState(true);
  const [mode, setMode] = useState<MolBioMode>('helix');
  const [showHBonds, setShowHBonds] = useState(true);
  const [hasLactose, setHasLactose] = useState(true);

  // Sequence Workbench state
  const [rawInput, setRawInput] = useState('ATGGCCAAAGGTACCTAA');
  const [readingMode, setReadingMode] = useState<ReadingMode>('start-aug');
  const [mutationType, setMutationType] = useState<MutationType>('none');
  const [mutPos, setMutPos] = useState(6);
  const [mutBase, setMutBase] = useState<'A' | 'T' | 'G' | 'C'>('T');
  const [showCodonTable, setShowCodonTable] = useState(false);

  const animRefs = useRef<{
    helixGroup?: THREE.Group;
    enzymeMesh?: THREE.Mesh;
    ribosomeGroup?: THREE.Group;
    repressor?: THREE.Mesh;
    rnaPol?: THREE.Mesh;
  }>({});

  // Normalize & validate DNA input (A, T, G, C only)
  const cleanSeqInfo = useMemo(() => {
    const upper = rawInput.toUpperCase().replace(/\s+/g, '');
    const invalidChars = upper.replace(/[ATGC]/g, '');
    const coding = upper.replace(/[^ATGC]/g, '').slice(0, 36); // safe cap for 3D helix clarity
    const template = coding.split('').map(complementDnaBase).join('');
    const mrna = template.split('').map(transcribeTemplateToMrna).join('');
    const trans = translateMrna(mrna, readingMode);

    // Mutated sequence comparison
    let mutCoding = coding;
    if (mutationType === 'substitute' && coding.length > 0) {
      const idx = Math.min(Math.max(0, mutPos - 1), coding.length - 1);
      mutCoding = coding.slice(0, idx) + mutBase + coding.slice(idx + 1);
    } else if (mutationType === 'delete' && coding.length > 1) {
      const idx = Math.min(Math.max(0, mutPos - 1), coding.length - 1);
      mutCoding = coding.slice(0, idx) + coding.slice(idx + 1);
    } else if (mutationType === 'insert' && coding.length > 0) {
      const idx = Math.min(Math.max(0, mutPos - 1), coding.length);
      mutCoding = coding.slice(0, idx) + mutBase + coding.slice(idx);
    }
    const mutTemplate = mutCoding.split('').map(complementDnaBase).join('');
    const mutMrna = mutTemplate.split('').map(transcribeTemplateToMrna).join('');
    const mutTrans = translateMrna(mutMrna, readingMode);

    return {
      invalidChars,
      coding,
      template,
      mrna,
      trans,
      mutCoding,
      mutMrna,
      mutTrans,
    };
  }, [rawInput, readingMode, mutationType, mutPos, mutBase]);

  const sourceMeta: ScientificSourceMeta = {
    name: 'Mô hình DNA xoắn kép & Biểu hiện Gene 3D',
    source: 'SINH HỌC SMART 3D (Bảng mã di truyền chuẩn & Cơ chế Sinh học phân tử)',
    identifier: `MOLBIO-${mode.toUpperCase()}`,
    version: '1.0',
    license: 'Tài nguyên giáo dục nội bộ',
    dataType: 'Mô hình giản lược sư phạm',
    verifiedStatus: 'Chuẩn chiều 5′→3′, 3′→5′, A=T (2 lk H), G≡C (3 lk H)',
    scaleNote: 'Quy ước màu thống nhất toàn ứng dụng: A (Xanh lá), T (Vàng hổ phách), G (Xanh dương), C (Đỏ), U (Tím).',
  };

  const buildModel = useMemo(() => {
    return (rootGroup: THREE.Group, quality: QualityLevel) => {
      animRefs.current = {};
      const segs = quality === 'low' ? 10 : 18;
      const seq = (cleanSeqInfo.coding || 'ATGGCCAAATAG').slice(0, 18);

      if (mode === 'helix') {
        const helixGroup = new THREE.Group();
        rootGroup.add(helixGroup);

        const backboneGroup = new THREE.Group();
        backboneGroup.userData.partId = 'backbone';
        const hbondGroup = new THREE.Group();
        hbondGroup.userData.partId = 'hbonds';

        const radius = 1.05;
        const stepY = 0.42;
        const twist = 0.56;
        const startY = -((seq.length - 1) * stepY) / 2;

        const strand1Pts: THREE.Vector3[] = [];
        const strand2Pts: THREE.Vector3[] = [];

        const sugarMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 });
        const phosMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const hbondMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });

        for (let i = 0; i < seq.length; i++) {
          const angle = i * twist;
          const y = startY + i * stepY;
          const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          const p2 = new THREE.Vector3(-Math.cos(angle) * radius, y, -Math.sin(angle) * radius);
          strand1Pts.push(p1);
          strand2Pts.push(p2);

          // Deoxyribose pentagon-like cylinder + Phosphate sphere
          const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 5), sugarMat);
          s1.position.copy(p1);
          const ph1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), phosMat);
          ph1.position.copy(p1).add(new THREE.Vector3(0, stepY * 0.45, 0));

          const s2 = s1.clone();
          s2.position.copy(p2);
          const ph2 = ph1.clone();
          ph2.position.copy(p2).add(new THREE.Vector3(0, -stepY * 0.45, 0));
          backboneGroup.add(s1, ph1, s2, ph2);

          // Nitrogenous Base pair
          const b1 = seq[i] as keyof typeof BASE_COLORS;
          const b2 = complementDnaBase(b1) as keyof typeof BASE_COLORS;
          const dir12 = p2.clone().sub(p1).normalize();

          const m1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.14, 0.68),
            new THREE.MeshStandardMaterial({ color: BASE_COLORS[b1] ?? '#22C55E', roughness: 0.35 }),
          );
          m1.position.copy(p1).lerp(p2, 0.27);
          m1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir12);
          m1.userData.partId = `base-${b1}`;

          const m2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.14, 0.68),
            new THREE.MeshStandardMaterial({ color: BASE_COLORS[b2] ?? '#F59E0B', roughness: 0.35 }),
          );
          m2.position.copy(p1).lerp(p2, 0.73);
          m2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir12);
          m2.userData.partId = `base-${b2}`;
          helixGroup.add(m1, m2);

          // Hydrogen bonds: 2 for A-T, 3 for G-C
          if (showHBonds) {
            const bondCount = b1 === 'A' || b1 === 'T' ? 2 : 3;
            for (let hb = 0; hb < bondCount; hb++) {
              const offset = (hb - (bondCount - 1) / 2) * 0.09;
              const dot = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), hbondMat);
              dot.position.copy(p1).lerp(p2, 0.5);
              dot.position.y += offset;
              hbondGroup.add(dot);
            }
          }
        }

        const tube1 = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand1Pts), 60, 0.065, segs, false),
          sugarMat,
        );
        const tube2 = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand2Pts), 60, 0.065, segs, false),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 }),
        );
        backboneGroup.add(tube1, tube2);
        helixGroup.add(backboneGroup, hbondGroup);
        animRefs.current.helixGroup = helixGroup;
        return { initialCameraDir: new THREE.Vector3(0.4, 0.15, 1) };
      }

      if (mode === 'replication') {
        // Replication fork: parental helix splitting into Leading (5'->3' continuous) & Lagging (Okazaki fragments)
        const pMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 });
        const newMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 });
        const okazakiMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 });

        // Left template strand
        const leftCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.5, 0, 0),
          new THREE.Vector3(-0.6, 0, 0),
          new THREE.Vector3(0.8, 0.9, 0.3),
          new THREE.Vector3(2.4, 1.35, 0.4),
        ]);
        const rightCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.5, -0.35, 0.35),
          new THREE.Vector3(-0.6, -0.15, 0.2),
          new THREE.Vector3(0.8, -0.9, -0.3),
          new THREE.Vector3(2.4, -1.35, -0.4),
        ]);
        rootGroup.add(
          new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 40, 0.09, 12, false), pMat),
          new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 40, 0.09, 12, false), pMat),
        );

        // Leading continuous new strand (top)
        const leadCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.3, 1.05, 0.4),
          new THREE.Vector3(0.8, 0.65, 0.3),
          new THREE.Vector3(-0.2, 0.15, 0.05),
        ]);
        rootGroup.add(new THREE.Mesh(new THREE.TubeGeometry(leadCurve, 28, 0.075, 10, false), newMat));

        // Lagging Okazaki fragments (bottom)
        [0, 1, 2].forEach((k) => {
          const x0 = 0.1 + k * 0.78;
          const frag = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.58, 10), okazakiMat);
          frag.rotation.z = Math.PI / 2 - 0.2;
          frag.position.set(x0, -0.55 - k * 0.28, -0.25);
          rootGroup.add(frag);
        });

        // Helicase ring unwinding fork
        const helicase = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.16, 12, 24),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 }),
        );
        helicase.rotation.y = Math.PI / 2;
        helicase.position.set(-0.3, 0, 0.1);
        rootGroup.add(helicase);
        animRefs.current.enzymeMesh = helicase;
        return { initialCameraDir: new THREE.Vector3(0.15, 0.25, 1) };
      }

      if (mode === 'transcription') {
        const dnaMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
        const mrnaMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.35 });
        const topStrand = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.6, 0.25, 0),
          new THREE.Vector3(-0.8, 0.55, 0.3),
          new THREE.Vector3(0.8, 0.55, 0.3),
          new THREE.Vector3(2.6, 0.25, 0),
        ]);
        const botStrand = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.6, -0.25, 0),
          new THREE.Vector3(-0.8, -0.55, -0.3),
          new THREE.Vector3(0.8, -0.55, -0.3),
          new THREE.Vector3(2.6, -0.25, 0),
        ]);
        rootGroup.add(
          new THREE.Mesh(new THREE.TubeGeometry(topStrand, 40, 0.08, 12, false), dnaMat),
          new THREE.Mesh(new THREE.TubeGeometry(botStrand, 40, 0.08, 12, false), dnaMat),
        );

        const rnaPol = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 20, 20),
          new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.35, transparent: true, opacity: 0.55 }),
        );
        rnaPol.scale.set(1.25, 0.95, 0.95);
        rootGroup.add(rnaPol);

        const mrnaCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.1, -0.25, 0),
          new THREE.Vector3(-0.9, -0.85, 0.35),
          new THREE.Vector3(-2.0, -1.45, 0.55),
        ]);
        rootGroup.add(new THREE.Mesh(new THREE.TubeGeometry(mrnaCurve, 30, 0.08, 10, false), mrnaMat));
        animRefs.current.enzymeMesh = rnaPol;
        return { initialCameraDir: new THREE.Vector3(0.15, 0.2, 1) };
      }

      if (mode === 'translation') {
        // mRNA ribbon
        const mrna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 5.2, 14),
          new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4 }),
        );
        mrna.rotation.z = Math.PI / 2;
        rootGroup.add(mrna);

        // Ribosome (Large + Small subunit)
        const ribo = new THREE.Group();
        const largeSub = new THREE.Mesh(
          new THREE.SphereGeometry(0.82, 20, 20),
          new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.4, transparent: true, opacity: 0.7 }),
        );
        largeSub.scale.set(1.2, 0.85, 0.9);
        largeSub.position.y = 0.55;
        const smallSub = new THREE.Mesh(
          new THREE.SphereGeometry(0.62, 18, 18),
          new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.4 }),
        );
        smallSub.scale.set(1.25, 0.65, 0.85);
        smallSub.position.y = -0.35;
        ribo.add(largeSub, smallSub);

        // Growing polypeptide beads
        for (let i = 0; i < 6; i++) {
          const aaBead = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 12, 12),
            new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf59e0b : 0xef4444, roughness: 0.3 }),
          );
          aaBead.position.set(-0.2 + Math.sin(i * 0.7) * 0.15, 1.35 + i * 0.24, 0.1);
          ribo.add(aaBead);
        }
        rootGroup.add(ribo);
        animRefs.current.ribosomeGroup = ribo;
        return { initialCameraDir: new THREE.Vector3(0.1, 0.25, 1) };
      }

      // OPERON LAC
      const dnaTrack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 5.8, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45 }),
      );
      dnaTrack.rotation.z = Math.PI / 2;
      rootGroup.add(dnaTrack);

      // P, O, Z, Y, A gene blocks
      const blocks: [number, number, string][] = [
        [-2.1, 0x38bdf8, 'Promoter (P)'],
        [-1.3, 0xf59e0b, 'Operator (O)'],
        [-0.2, 0x22c55e, 'lacZ'],
        [0.9, 0x10b981, 'lacY'],
        [2.0, 0x0d9488, 'lacA'],
      ];
      blocks.forEach(([bx, col]) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.36, 0.36),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }),
        );
        b.position.set(bx, 0, 0);
        rootGroup.add(b);
      });

      const repressor = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
      );
      repressor.position.set(-1.3, hasLactose ? 1.15 : 0.38, 0);
      rootGroup.add(repressor);

      const rnaPol = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 }),
      );
      rnaPol.position.set(-2.1, 0.48, 0);
      rootGroup.add(rnaPol);

      animRefs.current = { repressor, rnaPol };
      return { initialCameraDir: new THREE.Vector3(0, 0.25, 1) };
    };
  }, [mode, cleanSeqInfo.coding, showHBonds, hasLactose]);

  const handleAnimateFrame = (ctx: SceneUpdateContext) => {
    const refs = animRefs.current;
    const t = ctx.isPlaying ? ctx.elapsed * ctx.speed : ctx.simTime;

    if (mode === 'helix' && refs.helixGroup) {
      refs.helixGroup.rotation.y = t * 0.35;
    } else if ((mode === 'replication' || mode === 'transcription') && refs.enzymeMesh) {
      refs.enzymeMesh.position.x = Math.sin(t * 0.9) * 0.45;
    } else if (mode === 'translation' && refs.ribosomeGroup) {
      refs.ribosomeGroup.position.x = -1.6 + ((t * 0.55) % 3.2);
    } else if (mode === 'operon-lac' && refs.rnaPol) {
      if (hasLactose) {
        refs.rnaPol.position.x = -2.1 + ((t * 1.1) % 4.4);
      } else {
        refs.rnaPol.position.x = -2.1; // blocked by repressor at O!
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        {(
          [
            ['helix', 'Mô hình DNA xoắn kép'],
            ['replication', 'Tái bản DNA'],
            ['transcription', 'Phiên mã (mRNA)'],
            ['translation', 'Dịch mã (Ribosome)'],
            ['operon-lac', 'Điều hòa Operon lac'],
          ] as [MolBioMode, string][]
        ).map(([mId, mLabel]) => (
          <button
            key={mId}
            type="button"
            onClick={() => setMode(mId)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold text-ui-min ${
              mode === mId ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {mLabel}
          </button>
        ))}
      </div>

      {/* Central Dogma Sequence Workbench */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-ui-card-title">
              Trình giải mã DNA → mRNA → Chuỗi Amino acid & Kiểm tra đột biến
            </h3>
            <p className="text-slate-600 text-ui-min">
              Nhập trình tự DNA mạch mã hóa (chỉ chấp nhận A, T, G, C). Hệ thống tự động chuẩn hóa và đối chiếu khung đọc.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCodonTable((v) => !v)}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 text-ui-min"
          >
            {showCodonTable ? 'Ẩn bảng mã di truyền (64 codon)' : 'Mở bảng mã di truyền (64 codon)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="md:col-span-2 block space-y-1">
            <span className="font-semibold text-slate-800 text-ui-min">
              Trình tự DNA mạch mã hóa (5′ → 3′):
            </span>
            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Ví dụ: ATGGCCAAAGGTACCTAA"
              className="w-full min-h-[46px] px-3.5 py-2 rounded-lg border border-slate-300 font-mono-tabular text-slate-900 uppercase text-ui-label"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-800 text-ui-min">Chế độ khung đọc dịch mã:</span>
            <select
              value={readingMode}
              onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
              className="w-full min-h-[46px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
            >
              <option value="start-aug">Bắt đầu từ codon mở đầu AUG</option>
              <option value="direct-codons">Dịch từng bộ ba từ đầu trình tự</option>
            </select>
          </label>
        </div>

        {cleanSeqInfo.invalidChars && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-amber-900 text-ui-min">
            Đã tự động bỏ qua ký tự không hợp lệ ({cleanSeqInfo.invalidChars}). Chỉ chấp nhận A, T, G, C.
          </div>
        )}

        {!cleanSeqInfo.trans.foundStart && readingMode === 'start-aug' && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-amber-900 text-ui-min">
            Cảnh báo: Chưa tìm thấy codon mở đầu AUG trên mRNA để khởi đầu dịch mã.
          </div>
        )}

        {cleanSeqInfo.trans.remainder > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-blue-900 text-ui-min">
            Cảnh báo: Trình tự hiện tại còn dư {cleanSeqInfo.trans.remainder} nucleotide lẻ chưa đủ 1 bộ ba hoàn chỉnh.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono-tabular text-ui-min bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-700">Mạch mã hóa (5′→3′): </span>
            <span className="break-all text-slate-900">5′-{cleanSeqInfo.coding}-3′</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Mạch khuôn (3′→5′): </span>
            <span className="break-all text-slate-900">3′-{cleanSeqInfo.template}-5′</span>
          </div>
          <div>
            <span className="font-bold text-violet-800">mRNA (5′→3′): </span>
            <span className="break-all text-violet-900 font-semibold">5′-{cleanSeqInfo.mrna}-3′</span>
          </div>
          <div>
            <span className="font-bold text-teal-800">Chuỗi Amino acid (N→C): </span>
            <span className="text-teal-900 font-semibold">
              {cleanSeqInfo.trans.aminoAcids.length > 0
                ? `${cleanSeqInfo.trans.aminoAcids.join(' – ')}${cleanSeqInfo.trans.stopped ? ' (Dừng tại mã kết thúc)' : ''}`
                : 'Chưa tạo chuỗi polypeptide'}
            </span>
          </div>
        </div>

        {/* Mutation Comparator */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-900 text-ui-min">Thử nghiệm đột biến gene:</span>
            <select
              value={mutationType}
              onChange={(e) => setMutationType(e.target.value as MutationType)}
              className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-ui-min"
            >
              <option value="none">Không đột biến</option>
              <option value="substitute">Đột biến thay thế 1 nucleotide</option>
              <option value="delete">Đột biến mất 1 nucleotide</option>
              <option value="insert">Đột biến thêm 1 nucleotide</option>
            </select>
            {mutationType !== 'none' && (
              <>
                <label className="inline-flex items-center gap-1.5 text-ui-min">
                  <span>Vị trí:</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, cleanSeqInfo.coding.length)}
                    value={mutPos}
                    onChange={(e) => setMutPos(Number(e.target.value))}
                    className="w-20 min-h-[44px] px-2 py-1 rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </label>
                {mutationType !== 'delete' && (
                  <label className="inline-flex items-center gap-1.5 text-ui-min">
                    <span>Nucleotide:</span>
                    <select
                      value={mutBase}
                      onChange={(e) => setMutBase(e.target.value as 'A' | 'T' | 'G' | 'C')}
                      className="min-h-[44px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="A">A</option>
                      <option value="T">T</option>
                      <option value="G">G</option>
                      <option value="C">C</option>
                    </select>
                  </label>
                )}
              </>
            )}
          </div>
          {mutationType !== 'none' && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 font-mono-tabular text-ui-min space-y-1">
              <div>
                <strong>Sau đột biến (mRNA):</strong> 5′-{cleanSeqInfo.mutMrna}-3′
              </div>
              <div>
                <strong>Polypeptide sau đột biến:</strong>{' '}
                {cleanSeqInfo.mutTrans.aminoAcids.join(' – ') || 'Không có'}
                {cleanSeqInfo.mutTrans.stopped ? ' (Dừng)' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Interactive 64-Codon Table */}
        {showCodonTable && (
          <div className="pt-3 border-t border-slate-200 overflow-x-auto">
            <h4 className="font-bold text-slate-900 text-ui-label mb-2">
              Bảng mã di truyền 64 bộ ba chuẩn trên mRNA (5′ → 3′)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
              {Object.entries(CODON_TABLE).map(([codon, info]) => (
                <div
                  key={codon}
                  className={`p-2 rounded-lg border text-ui-min ${
                    codon === 'AUG'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                      : info.aa === 'STOP'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="font-mono-tabular font-bold">{codon}</div>
                  <div>{info.aa}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LabWorkspaceLayout
        title="Phòng Lab 04 – DNA, RNA và Protein 3D"
        subtitle="Mô hình phân tử DNA hai mạch đối song song và các cơ chế truyền đạt thông tin di truyền"
        viewerRef={viewer.viewerRef}
        parts={HELIX_PARTS}
        selectedPartId={viewer.selectedPartId}
        onSelectPart={viewer.setSelectedPartId}
        hiddenPartIds={viewer.hiddenPartIds}
        onToggleHidePart={viewer.toggleHidePart}
        isolatedPartId={viewer.isolatedPartId}
        onToggleIsolatePart={viewer.setIsolatedPartId}
        autoRotate={viewer.autoRotate}
        onToggleAutoRotate={() => viewer.setAutoRotate((v) => !v)}
        showLabels={viewer.showLabels}
        onToggleLabels={() => viewer.setShowLabels((v) => !v)}
        opacityLevel={viewer.opacityLevel}
        onChangeOpacity={viewer.setOpacityLevel}
        clipY={viewer.clipY}
        onChangeClipY={viewer.setClipY}
        clipX={viewer.clipX}
        onChangeClipX={viewer.setClipX}
        explodeFactor={viewer.explodeFactor}
        onChangeExplode={viewer.setExplodeFactor}
        isPlaying={viewer.isPlaying}
        onTogglePlay={() => viewer.setIsPlaying((v) => !v)}
        onStepForward={() => {
          viewer.setIsPlaying(false);
          viewer.setSimStepOffset((s) => s + 0.35);
        }}
        onResetSim={viewer.resetViewAndParts}
        speed={viewer.speed}
        onChangeSpeed={viewer.setSpeed}
        quality={viewer.quality}
        onChangeQuality={viewer.setQuality}
        sourceMeta={sourceMeta}
        isPresentation={isPresentation}
        onTogglePresentation={onTogglePresentation}
        teacherGuideNote="Quy ước màu thống nhất: A (Xanh lá), T (Vàng), G (Xanh dương), C (Đỏ). Học sinh có thể thấy rõ 2 liên kết hydrogen giữa A–T và 3 liên kết hydrogen giữa G–C."
        stageContent={
          <ModelViewer3D
            ref={viewer.viewerRef}
            modelKey={`molbio-${mode}-${cleanSeqInfo.coding}-${showHBonds}-${hasLactose}`}
            buildModel={buildModel}
            onAnimateFrame={handleAnimateFrame}
            onSelectPart={viewer.setSelectedPartId}
            selectedPartId={viewer.selectedPartId}
            hiddenPartIds={viewer.hiddenPartIds}
            isolatedPartId={viewer.isolatedPartId}
            autoRotate={viewer.autoRotate}
            isPlaying={viewer.isPlaying}
            speed={viewer.speed}
            simTime={viewer.simStepOffset}
            opacityLevel={viewer.opacityLevel}
            clipY={viewer.clipY}
            clipX={viewer.clipX}
            explodeFactor={viewer.explodeFactor}
            showLabels={viewer.showLabels}
            parts={mode === 'helix' ? HELIX_PARTS : []}
            quality={viewer.quality}
            fallbackTitle="Sơ đồ DNA & Tổng hợp Protein 2D"
            fallbackItems={[
              `Mạch mã hóa: 5′-${cleanSeqInfo.coding}-3′`,
              `Mạch khuôn: 3′-${cleanSeqInfo.template}-5′`,
              `mRNA: 5′-${cleanSeqInfo.mrna}-3′`,
              `Polypeptide: ${cleanSeqInfo.trans.aminoAcids.join(' – ')}`,
            ]}
          />
        }
        simulationControlsExtra={
          <div className="space-y-3">
            {mode === 'helix' && (
              <label className="flex items-center gap-2 text-slate-800 text-ui-min cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={showHBonds}
                  onChange={(e) => setShowHBonds(e.target.checked)}
                  className="w-5 h-5 accent-teal-700"
                />
                <span>Hiện các liên kết Hydrogen (A=T, G≡C)</span>
              </label>
            )}
            {mode === 'operon-lac' && (
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 text-ui-min block">
                  Điều kiện môi trường nuôi E. coli:
                </span>
                <button
                  type="button"
                  onClick={() => setHasLactose(true)}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg font-medium text-left text-ui-min ${
                    hasLactose ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Có Lactose → Protein ức chế bất hoạt → Phiên mã diễn ra
                </button>
                <button
                  type="button"
                  onClick={() => setHasLactose(false)}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg font-medium text-left text-ui-min ${
                    !hasLactose ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Không có Lactose → Protein ức chế bám O → Ngăn phiên mã
                </button>
              </div>
            )}
          </div>
        }
        knowledgeContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Nguyên tắc truyền thông tin di truyền</h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>Tái bản DNA theo nguyên tắc bổ sung và bán bảo toàn; mạch mới luôn tổng hợp theo chiều 5′ → 3′.</li>
              <li>Phiên mã chỉ sử dụng mạch khuôn 3′ → 5′ để tạo mRNA 5′ → 3′.</li>
              <li>Mã kết thúc UAA, UAG, UGA làm kết thúc dịch mã, không mã hóa amino acid.</li>
            </ul>
          </div>
        }
        practiceContent={
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-ui-card-title">Nhiệm vụ thực hành</h4>
            <p className="text-slate-700">
              Nhập trình tự DNA bất kì và bật chế độ Đột biến mất 1 nucleotide ở vị trí số 5 để quan sát sự dịch khung đọc trên chuỗi amino acid.
            </p>
          </div>
        }
      />
    </div>
  );
};
