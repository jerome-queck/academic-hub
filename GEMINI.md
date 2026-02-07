# NTU GPA Calculation Instructions

You are to create a GPA calculator app specialized in the Nanyang Technological University (NTU) grading system. Follow these rules to calculate the Grade Point Average (GPA) or Cumulative Grade Point Average (CGPA).

### 1. Grade Point Mapping
Map letter grades to the following points:
- **A+ / A**: 5.0
- **A-**: 4.5
- **B+**: 4.0
- **B**: 3.5
- **B-**: 3.0
- **C+**: 2.5
- **C**: 2.0
- **D+**: 1.5
- **D**: 1.0
- **F**: 0.0

### 2. Excluded Grades
DO NOT include courses with the following notations in the calculation (both the numerator and the denominator):
- **S/U** (Satisfactory/Unsatisfactory)
- **P/F** (Pass/Fail)
- **EX** (Exempted)
- **TC** (Transfer Credits)
- **IP** (In Progress)
- **LOA** (Leave of Absence)

### 3. Calculation Formula
Calculate the CGPA using the following formula:
**CGPA = Σ (Grade Point × AU) / Σ (Total AU attempted)**

*Note: 'AU' refers to Academic Units. All attempted letter-graded courses (including 'F') must be included in the total AU.*

### 4. Classification Reference
Use the following ranges to classify the result for a 4-year programme:
- **4.50 – 5.00**: First Class Honours
- **4.00 – 4.49**: Second Class Upper
- **3.50 – 3.99**: Second Class Lower
- **3.00 – 3.49**: Third Class
- **2.00 – 2.99**: Pass
- **Below 2.00**: Academic Warning/Termination

### Example Input Format to Process:
"Calculate GPA for: Course A (3 AU, Grade A-), Course B (3 AU, Grade B), Course C (4 AU, Grade F), Course D (3 AU, Grade S)."

### Example Output Logic:
1. Convert grades: A-(4.5), B(3.5), F(0.0). Ignore S.
2. Sum of (Point * AU): (4.5*3) + (3.5*3) + (0*4) = 13.5 + 10.5 + 0 = 24.
3. Sum of AU: 3 + 3 + 4 = 10.
4. Final CGPA: 24 / 10 = 

Also create a separate portion of the app which tracks all the modules taken by the user and save it into the memory of the app. That portion of the app should display also the modules which are not computed into the GPA calculation. Also, when the user adds a module, ask for the module code, the module type, etc. 