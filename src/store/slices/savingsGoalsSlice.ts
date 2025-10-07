import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  color: string;
  icon: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  description?: string;
  source: 'manual' | 'roundup' | 'recurring' | 'bonus';
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  type: 'quarter' | 'half' | 'three_quarters' | 'completed';
  achievedAt: string;
  amount: number;
  percentage: number;
}

interface SavingsGoalsState {
  goals: SavingsGoal[];
  contributions: GoalContribution[];
  milestones: GoalMilestone[];
  loading: boolean;
  error: string | null;
  roundUpEnabled: boolean;
  roundUpAmount: number;
}

const initialState: SavingsGoalsState = {
  goals: [],
  contributions: [],
  milestones: [],
  loading: false,
  error: null,
  roundUpEnabled: false,
  roundUpAmount: 0,
};

const savingsGoalsSlice = createSlice({
  name: 'savingsGoals',
  initialState,
  reducers: {
    // Goal management
    addGoal: (state, action: PayloadAction<SavingsGoal>) => {
      state.goals.unshift(action.payload);
    },
    updateGoal: (state, action: PayloadAction<SavingsGoal>) => {
      const index = state.goals.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = { ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    deleteGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(g => g.id !== action.payload);
      // Also remove related contributions and milestones
      state.contributions = state.contributions.filter(c => c.goalId !== action.payload);
      state.milestones = state.milestones.filter(m => m.goalId !== action.payload);
    },
    completeGoal: (state, action: PayloadAction<string>) => {
      const goal = state.goals.find(g => g.id === action.payload);
      if (goal) {
        goal.isCompleted = true;
        goal.updatedAt = new Date().toISOString();
      }
    },

    // Contribution management
    addContribution: (state, action: PayloadAction<GoalContribution>) => {
      state.contributions.unshift(action.payload);
      // Update goal current amount
      const goal = state.goals.find(g => g.id === action.payload.goalId);
      if (goal) {
        goal.currentAmount += action.payload.amount;
        goal.updatedAt = new Date().toISOString();
        
        // Check for milestones
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        const newMilestones = [];
        
        if (percentage >= 25 && !state.milestones.some(m => m.goalId === goal.id && m.type === 'quarter')) {
          newMilestones.push({
            id: `milestone_${Date.now()}_quarter`,
            goalId: goal.id,
            type: 'quarter',
            achievedAt: new Date().toISOString(),
            amount: goal.currentAmount,
            percentage: 25,
          });
        }
        
        if (percentage >= 50 && !state.milestones.some(m => m.goalId === goal.id && m.type === 'half')) {
          newMilestones.push({
            id: `milestone_${Date.now()}_half`,
            goalId: goal.id,
            type: 'half',
            achievedAt: new Date().toISOString(),
            amount: goal.currentAmount,
            percentage: 50,
          });
        }
        
        if (percentage >= 75 && !state.milestones.some(m => m.goalId === goal.id && m.type === 'three_quarters')) {
          newMilestones.push({
            id: `milestone_${Date.now()}_three_quarters`,
            goalId: goal.id,
            type: 'three_quarters',
            achievedAt: new Date().toISOString(),
            amount: goal.currentAmount,
            percentage: 75,
          });
        }
        
        if (percentage >= 100 && !state.milestones.some(m => m.goalId === goal.id && m.type === 'completed')) {
          newMilestones.push({
            id: `milestone_${Date.now()}_completed`,
            goalId: goal.id,
            type: 'completed',
            achievedAt: new Date().toISOString(),
            amount: goal.currentAmount,
            percentage: 100,
          });
          goal.isCompleted = true;
        }
        
        state.milestones.push(...newMilestones);
      }
    },
    updateContribution: (state, action: PayloadAction<GoalContribution>) => {
      const index = state.contributions.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        const oldContribution = state.contributions[index];
        const newContribution = action.payload;
        
        // Update goal current amount
        const goal = state.goals.find(g => g.id === newContribution.goalId);
        if (goal) {
          goal.currentAmount = goal.currentAmount - oldContribution.amount + newContribution.amount;
          goal.updatedAt = new Date().toISOString();
        }
        
        state.contributions[index] = newContribution;
      }
    },
    deleteContribution: (state, action: PayloadAction<string>) => {
      const contribution = state.contributions.find(c => c.id === action.payload);
      if (contribution) {
        // Update goal current amount
        const goal = state.goals.find(g => g.id === contribution.goalId);
        if (goal) {
          goal.currentAmount -= contribution.amount;
          goal.updatedAt = new Date().toISOString();
        }
      }
      state.contributions = state.contributions.filter(c => c.id !== action.payload);
    },

    // Round-up settings
    setRoundUpEnabled: (state, action: PayloadAction<boolean>) => {
      state.roundUpEnabled = action.payload;
    },
    setRoundUpAmount: (state, action: PayloadAction<number>) => {
      state.roundUpAmount = action.payload;
    },

    // Bulk operations
    setGoals: (state, action: PayloadAction<SavingsGoal[]>) => {
      state.goals = action.payload;
    },
    setContributions: (state, action: PayloadAction<GoalContribution[]>) => {
      state.contributions = action.payload;
    },
    setMilestones: (state, action: PayloadAction<GoalMilestone[]>) => {
      state.milestones = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  addContribution,
  updateContribution,
  deleteContribution,
  setRoundUpEnabled,
  setRoundUpAmount,
  setGoals,
  setContributions,
  setMilestones,
  setLoading,
  setError,
} = savingsGoalsSlice.actions;

export default savingsGoalsSlice.reducer;
