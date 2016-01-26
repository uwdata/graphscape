class CreateEmbedments < ActiveRecord::Migration
  def change
    create_table :embedments do |t|
      t.string :title
      t.string :filename

      t.timestamps null: false
    end
  end
end
