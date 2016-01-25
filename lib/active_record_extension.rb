module ActiveRecordExtension
  require 'csv'
  extend ActiveSupport::Concern

  # add your static(class) methods here
  module ClassMethods

    #E.g: Order.top_ten
    def find_by_id_in_csv(id)

      row = nil
      CSV.open("csv/" + self.to_s.downcase.pluralize + ".csv", 'r', {headers: true} ) do |csv|
        # skipping rows before one we need
        id.times { row = csv.readline }
      end

      return self.new(row.to_hash)
    end

    def all_in_csv

      CSV.read("csv/" + self.to_s.downcase.pluralize + ".csv", { headers: true }).map do |row|
        self.new(row.to_hash)
      end

    end

  end
end

# include the extension
ActiveRecord::Base.send(:include, ActiveRecordExtension)