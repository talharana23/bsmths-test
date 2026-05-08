import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Default admin credentials (used only on first boot if admin.json doesn't exist)
const DEFAULT_ADMIN = { id: 'admin', name: 'Administrator', password: 'admin123' };

// Ensure data directory and required files exist
const initStorage = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaults = {
    'students.json': [],
    'tests.json': [],
    'results.json': [],
    'admin.json': DEFAULT_ADMIN,
  };

  Object.entries(defaults).forEach(([file, defaultValue]) => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    }
  });

  // Auto-seed students from data.json if students.json is empty
  const studentsPath = path.join(DATA_DIR, 'students.json');
  try {
    const currentStudents = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
    if (Array.isArray(currentStudents) && currentStudents.length === 0) {
      const seedPath = path.join(process.cwd(), 'data.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(seedData) && seedData.length > 0) {
          const students = seedData.map(s => ({
            id: s.cnic?.toString() || s.id?.toString(),
            name: s.name || `Student ${s.cnic || s.id}`,
            password: s.roll_no?.toString() || s.password?.toString() || '123456',
            disabled: false
          })).filter(s => s.id);
          fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
        }
      }
    }
  } catch (e) {
    // Silently skip if seed fails
  }
};

initStorage();

export const getData = (filename) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filename}.json`);
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`Failed to read or parse ${filename}.json: ${err.message}`);
  }
};

export const saveData = (filename, data) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

