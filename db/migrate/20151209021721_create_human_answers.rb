class CreateHumanAnswers < ActiveRecord::Migration
  def change
    create_table :human_answers do |t|
      t.string :answer
      t.integer :triplet_id

      t.timestamps null: false
    end
  end
end
