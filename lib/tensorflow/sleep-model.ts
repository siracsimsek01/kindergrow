import * as tf from "@tensorflow/tfjs"

// Define the model interface
export interface SleepModel {
  predict(input: number[][]): tf.Tensor
  train(inputs: number[][], outputs: number[][], epochs?: number): Promise<tf.History>
}

// Create a sleep prediction model
export async function createSleepModel(): Promise<SleepModel> {
  // Create a sequential model
  const model = tf.sequential()

  // Add layers
  model.add(
    tf.layers.dense({
      units: 16,
      activation: "relu",
      inputShape: [7], // 7 days of sleep data
    }),
  )

  model.add(
    tf.layers.dense({
      units: 8,
      activation: "relu",
    }),
  )

  model.add(
    tf.layers.dense({
      units: 1, // Predict next day's sleep duration
    }),
  )

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(),
    loss: "meanSquaredError",
  })

  return {
    predict(input: number[][]) {
      return model.predict(tf.tensor2d(input)) as tf.Tensor
    },

    async train(inputs: number[][], outputs: number[][], epochs = 50) {
      const xs = tf.tensor2d(inputs)
      const ys = tf.tensor2d(outputs)

      return await model.fit(xs, ys, {
        epochs,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss}`)
          },
        },
      })
    },
  }
}

// Prepare sleep data for the model
export function prepareSleepData(sleepEvents: any[], days = 30) {
  // Get the last 'days' days of sleep data
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Filter events within date range
  const filteredEvents = sleepEvents.filter(
    (event) => new Date(event.timestamp) >= startDate && new Date(event.timestamp) <= today,
  )

  // Group by day and calculate total sleep duration
  const sleepByDay: Record<string, number> = {}

  filteredEvents.forEach((event) => {
    const date = new Date(event.timestamp)
    const dateKey = date.toISOString().split("T")[0]

    sleepByDay[dateKey] = (sleepByDay[dateKey] || 0) + event.duration
  })

  // Create a continuous array of sleep durations
  const sleepDurations: number[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split("T")[0]

    // Use actual data or 0 if no data for that day
    sleepDurations.push(sleepByDay[dateKey] || 0)
  }

  // Create input/output pairs for training
  // Input: 7 consecutive days, Output: the next day
  const inputs: number[][] = []
  const outputs: number[][] = []

  for (let i = 0; i < sleepDurations.length - 7; i++) {
    const input = sleepDurations.slice(i, i + 7)
    const output = [sleepDurations[i + 7]]

    inputs.push(input)
    outputs.push(output)
  }

  return { inputs, outputs, sleepDurations }
}

// Predict sleep for the next day
export async function predictNextDaySleep(model: SleepModel, recentSleepData: number[]) {
  // Ensure we have exactly 7 days of data
  const input = recentSleepData.slice(-7)

  // If we don't have enough data, pad with zeros
  while (input.length < 7) {
    input.unshift(0)
  }

  // Make prediction
  const inputTensor = tf.tensor2d([input])
  const prediction = model.predict([input])
  const result = await prediction.data()

  // Clean up tensors
  inputTensor.dispose()
  prediction.dispose()

  return result[0]
}

